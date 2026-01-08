import {
  WriteMetricsRequestSchema,
  type WriteMetricsRequest,
  type WriteMetricsResponse,
} from "@overdrip/core/schemas";
import { MetricServiceClient } from "@google-cloud/monitoring";
import { HttpsError, onCall } from "firebase-functions/https";
import { error, info } from "firebase-functions/logger";

const metricClient = new MetricServiceClient();

export const writeMetrics = onCall<
  WriteMetricsRequest,
  Promise<WriteMetricsResponse>
>({ cors: true }, async (req) => {
  // Ensure device is authenticated
  const uid = req.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }

  const { deviceId, metrics } = WriteMetricsRequestSchema.parse(req.data);
  info({
    message: "Received metrics write request",
    deviceId,
    metricsCount: metrics.length,
  });

  try {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (!projectId) {
      throw new Error("Project ID not found in environment");
    }

    const projectName = metricClient.projectPath(projectId);

    // Build time series data for Cloud Monitoring
    const timeSeries = metrics.map((metric) => ({
      metric: {
        type: `custom.googleapis.com/overdrip/${metric.type}`,
        labels: {
          device_id: deviceId,
          plant_id: metric.plantId,
        },
      },
      resource: {
        type: "generic_node",
        labels: {
          project_id: projectId,
          location: "global",
          namespace: "overdrip",
          node_id: deviceId,
        },
      },
      points: [
        {
          interval: {
            endTime: {
              seconds: Math.floor(metric.timestamp / 1000),
            },
          },
          value: {
            doubleValue: metric.value,
          },
        },
      ],
    }));

    // Write to Cloud Monitoring
    await metricClient.createTimeSeries({
      name: projectName,
      timeSeries,
    });

    info({
      message: "Metrics written successfully",
      deviceId,
      metricsWritten: metrics.length,
    });

    return {
      success: true,
      metricsWritten: metrics.length,
    };
  } catch (err) {
    error({
      message: "Failed to write metrics",
      deviceId,
      error: err,
    });
    throw new HttpsError("internal", "Failed to write metrics to Cloud Monitoring.");
  }
});
