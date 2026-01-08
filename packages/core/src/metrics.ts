import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { info, warn } from "./logger";
import {
  WriteMetricsRequestSchema,
  WriteMetricsResponseSchema,
  type MetricDataPoint,
  type WriteMetricsRequest,
  type WriteMetricsResponse,
} from "./schemas";

export {
  MetricDataPointSchema,
  MetricTypeSchema,
  WriteMetricsRequestSchema,
  WriteMetricsResponseSchema,
  type MetricDataPoint,
  type MetricType,
  type WriteMetricsRequest,
  type WriteMetricsResponse,
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
