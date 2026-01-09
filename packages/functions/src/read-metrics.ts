import { MetricServiceClient } from "@google-cloud/monitoring";
import {
  ReadMetricsRequestSchema,
  type ReadMetricsRequest,
  type ReadMetricsResponse,
} from "@overdrip/core/schemas";
import { HttpsError, onCall } from "firebase-functions/https";
import { error, info } from "firebase-functions/logger";
import { app } from "./firebase";

const metricsClient = new MetricServiceClient();
const isEmulator =
  process.env.FUNCTIONS_EMULATOR === "true" ||
  Boolean(process.env.FIRESTORE_EMULATOR_HOST);

export const readMetrics = onCall<
  ReadMetricsRequest,
  Promise<ReadMetricsResponse>
>({ cors: true }, async (req) => {
  const userId = req.auth?.uid;

  if (!userId) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }

  const { deviceId, timeRange } = ReadMetricsRequestSchema.parse(req.data);

  info(`Reading metrics for device ${deviceId}, range: ${timeRange}`);

  try {
    // Verify user owns the device
    const deviceDoc = await app
      .firestore()
      .doc(`users/${userId}/devices/${deviceId}`)
      .get();

    if (!deviceDoc.exists) {
      error(`Device ${deviceId} not found for user ${userId}`);
      throw new HttpsError("permission-denied", "You do not own this device");
    }

    // Calculate time range
    const now = Date.now();
    const timeRanges = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - timeRanges[timeRange];

    if (isEmulator) {
      info("Running in emulator; returning empty metrics dataset");
      return { dataPoints: [] };
    }

    // Query Cloud Monitoring
    const projectId = app.options.projectId;
    if (!projectId) {
      throw new HttpsError("internal", "Project ID not configured");
    }

    const request = {
      name: `projects/${projectId}`,
      filter: `metric.type="custom.googleapis.com/overdrip/moisture" AND metric.label.device_id="${deviceId}"`,
      interval: {
        startTime: { seconds: Math.floor(startTime / 1000) },
        endTime: { seconds: Math.floor(now / 1000) },
      },
    };
    let timeSeries;
    try {
      [timeSeries] = await metricsClient.listTimeSeries(request);
    } catch (monitoringError) {
      const message =
        monitoringError instanceof Error
          ? monitoringError.message
          : "Unknown Cloud Monitoring error";
      error(`Cloud Monitoring query failed for ${deviceId}: ${message}`);
      throw new HttpsError("internal", `Failed to query metrics: ${message}`);
    }

    // Transform data points
    const dataPoints: Array<{
      timestamp: number;
      plantId: string;
      value: number;
    }> = [];
    for (const series of timeSeries) {
      const plantId = series.metric?.labels?.plant_id || "unknown";
      for (const point of series.points || []) {
        const endTimeSeconds = point.interval?.endTime?.seconds;
        const doubleValue = point.value?.doubleValue;
        if (
          endTimeSeconds &&
          doubleValue !== null &&
          doubleValue !== undefined &&
          typeof doubleValue === "number"
        ) {
          dataPoints.push({
            timestamp: Number(endTimeSeconds) * 1000,
            plantId,
            value: doubleValue,
          });
        }
      }
    }

    info(`Retrieved ${dataPoints.length} data points for device ${deviceId}`);

    return { dataPoints };
  } catch (err) {
    if (err instanceof HttpsError) {
      throw err;
    }

    error(`Error reading metrics for device ${deviceId}`, err);
    throw new HttpsError("internal", "An error occurred while reading metrics");
  }
});
