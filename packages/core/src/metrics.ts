import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { info, warn } from "./logger";
import {
  WriteMetricsRequestSchema,
  WriteMetricsResponseSchema,
  ReadMetricsRequestSchema,
  ReadMetricsResponseSchema,
  type MetricDataPoint,
  type MetricDataPointResponse,
  type WriteMetricsRequest,
  type WriteMetricsResponse,
  type ReadMetricsRequest,
  type ReadMetricsResponse,
} from "./schemas";

export {
  MetricDataPointSchema,
  MetricTypeSchema,
  WriteMetricsRequestSchema,
  WriteMetricsResponseSchema,
  ReadMetricsRequestSchema,
  ReadMetricsResponseSchema,
  type MetricDataPoint,
  type MetricDataPointResponse,
  type MetricType,
  type WriteMetricsRequest,
  type WriteMetricsResponse,
  type ReadMetricsRequest,
  type ReadMetricsResponse,
} from "./schemas";

/**
 * Write metrics to Google Cloud Monitoring via Cloud Function proxy.
 * Device must be authenticated before calling this function.
 */
export const writeMetrics = async (
  deviceId: string,
  metrics: MetricDataPoint[],
): Promise<WriteMetricsResponse> => {
  const writeMetricsCallable = httpsCallable<
    WriteMetricsRequest,
    WriteMetricsResponse
  >(functions, "writeMetrics");

  try {
    const request = WriteMetricsRequestSchema.parse({ deviceId, metrics });
    const result = await writeMetricsCallable(request);
    const response = WriteMetricsResponseSchema.parse(result.data);

    info({
      message: "Metrics written successfully",
      metricsWritten: response.metricsWritten,
    });

    return response;
  } catch (error) {
    warn({
      message: "Failed to write metrics",
      deviceId,
      metricsCount: metrics.length,
      error,
    });
    throw new Error(`Failed to write metrics: ${error}`);
  }
};

/**
 * Read metrics from Google Cloud Monitoring via Cloud Function proxy.
 * User must be authenticated before calling this function.
 * Only returns metrics for devices owned by the authenticated user.
 *
 * @param deviceId - The ID of the device to read metrics for
 * @param timeRange - The time range to query (1h, 6h, 24h, 7d)
 * @returns Array of metric data points
 */
export const readMetrics = async (
  deviceId: string,
  timeRange: "1h" | "6h" | "24h" | "7d" = "24h",
): Promise<MetricDataPointResponse[]> => {
  const readMetricsCallable = httpsCallable<
    ReadMetricsRequest,
    ReadMetricsResponse
  >(functions, "readMetrics");

  try {
    const request = ReadMetricsRequestSchema.parse({ deviceId, timeRange });
    const result = await readMetricsCallable(request);
    const response = ReadMetricsResponseSchema.parse(result.data);

    info({
      message: "Metrics read successfully",
      dataPointsRetrieved: response.dataPoints.length,
      timeRange,
    });

    return response.dataPoints;
  } catch (error) {
    warn({
      message: "Failed to read metrics",
      deviceId,
      timeRange,
      error,
    });
    throw new Error(`Failed to read metrics: ${error}`);
  }
};

