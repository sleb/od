# Metrics System

The Overdrip metrics system sends device sensor readings to Google Cloud Monitoring via a Cloud Function proxy, leveraging the existing Firebase authentication strategy.

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   Device    │─────▶│  Cloud Function  │─────▶│ Cloud Monitoring    │
│   (Pi App)  │      │  (writeMetrics)  │      │  (GCP Metrics API)  │
└─────────────┘      └──────────────────┘      └─────────────────────┘
   Firebase Auth       Service Account          Time Series Data
   (Custom Token)
```

### Components

1. **Device (packages/app)**: Reads sensors and calls `writeMetrics()` with data points
2. **Core Helper (packages/core/src/metrics.ts)**: Provides `writeMetrics()` function using Firebase callable
3. **Cloud Function (packages/functions/src/write-metrics.ts)**: Validates auth, transforms data, writes to Cloud Monitoring
4. **Schemas (packages/core/src/schemas.ts)**: Zod schemas for request/response validation

## Usage

### From Device App

```typescript
import { writeMetrics, type MetricDataPoint } from "@overdrip/core/metrics";

const metric: MetricDataPoint = {
  type: "moisture",
  value: 45.5,
  plantId: "plant-1",
  timestamp: Date.now(),
};

await writeMetrics(deviceId, [metric]);
```

### Metric Types

Currently supported:
- `moisture`: Soil moisture percentage (0-100)

### Data Structure

**MetricDataPoint:**
```typescript
{
  type: "moisture",        // Metric type
  value: 45.5,            // Numeric value
  plantId: "plant-1",     // Plant identifier
  timestamp: 1234567890   // Unix timestamp (ms)
}
```

**Cloud Monitoring Format:**
- Metric type: `custom.googleapis.com/overdrip/{type}`
- Resource type: `generic_node`
- Labels: `device_id`, `plant_id`
- Namespace: `overdrip`

## Implementation Details

### Authentication

- Device authenticates via Firebase custom token (same as existing auth flow)
- Cloud Function verifies `req.auth.uid` before processing
- Cloud Function uses its service account to write to Cloud Monitoring API

### Error Handling

- Metrics emission failures are logged but **do not stop** the device's main loop
- Validation errors throw immediately (schema violations)
- Cloud Monitoring API errors are caught and logged

### Batching

- Multiple metrics can be sent in a single request
- Current implementation: one metric per plant reading
- Future optimization: batch multiple readings over time

## Testing

**Core Package:**
```bash
bun test packages/core/src/metrics.test.ts
```

**Functions Package:**
```bash
bun test packages/functions/src/write-metrics.test.ts
```

## Cloud Monitoring Setup

### Enable API

```bash
gcloud services enable monitoring.googleapis.com
```

### View Metrics

```bash
# List custom metrics
gcloud monitoring metrics-descriptors list --filter="type:custom.googleapis.com/overdrip"

# Query moisture readings
gcloud monitoring time-series list \
  --filter='metric.type="custom.googleapis.com/overdrip/moisture"'
```

### Create Alerts (Optional)

```bash
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Low Moisture Alert" \
  --condition-threshold-value=30 \
  --condition-threshold-duration=300s
```

## Future Enhancements

- [ ] Add more metric types (temperature, pump activations, errors)
- [ ] Implement client-side batching to reduce function calls
- [ ] Add metric retention configuration
- [ ] Create pre-built dashboards in Cloud Monitoring
- [ ] Add metric export to BigQuery for long-term analysis
- [ ] Implement metric aggregation (hourly averages, min/max)

## Troubleshooting

**"Project ID not found" error:**
- Ensure `GCLOUD_PROJECT` or `GCP_PROJECT` env var is set in Cloud Functions environment

**"Permission denied" errors:**
- Verify Cloud Functions service account has `roles/monitoring.metricWriter` role

**High latency:**
- Consider batching metrics if writing frequently
- Check Cloud Monitoring API quotas

**Missing metrics in Cloud Monitoring:**
- Allow 1-2 minutes for new metric types to appear
- Verify project ID matches between function and console
