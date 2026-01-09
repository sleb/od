# Device Stats & Metrics Design Document

## Overview

This document defines the design for displaying device metrics and statistics in the Overdrip web dashboard.

**Status:** Design Document
**Last Updated:** January 2025

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Goals & Requirements](#goals--requirements)
- [Design Decision](#design-decision)
- [Architecture](#architecture)
- [Security Model](#security-model)
- [Implementation Plan](#implementation-plan)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Testing Strategy](#testing-strategy)
- [Future Enhancements](#future-enhancements)
- [Appendices](#appendices)

---

## Problem Statement

Users need to view real-time moisture sensor data and device metrics for their registered devices through the web dashboard.

### Current State

- Devices send moisture readings to Cloud Monitoring via `writeMetrics` Cloud Function
- Metrics stored as time series: `custom.googleapis.com/overdrip/moisture`
- No visualization exists in web dashboard
- Users cannot view their device's historical data

### Requirements

1. **Security:** Users can only view metrics for devices they own
2. **Simplicity:** Minimal code to maintain, leverage existing infrastructure
3. **Scalability:** Solution works for 1 device or 1000 devices
4. **Cost:** Minimal or zero additional operational cost
5. **UX:** Seamless in-app experience (no external navigation)
6. **Maintainability:** Low operational burden for infrastructure/admin team

---

## Goals & Requirements

### Functional Requirements

- [x] Display moisture readings for last 24 hours (default)
- [x] Filter metrics by device ID
- [x] Show multiple plants per device
- [x] Support time range selection (stretch: 1h, 6h, 24h, 7d)
- [x] Update automatically without manual refresh

### Non-Functional Requirements

- **Performance:** Dashboard loads in <2 seconds
- **Security:** Device ownership verified on every request
- **Cost:** <$10/month incremental cost at 1000 devices
- **Maintenance:** <1 hour/month ongoing maintenance
- **Scalability:** No per-device configuration required

### Constraints

- Must use existing Cloud Monitoring infrastructure
- Must integrate with existing Firebase Auth
- Cannot require GCP Console access for end users
- Must work with Bun build system (not Vite)

---

## Design Decision

### Selected Approach: Custom Charts with Server-Side Data Query

**Rationale:** Query Cloud Monitoring API from server-side Cloud Function, return data points, and render charts client-side using Recharts.

#### Why This Approach?

1. **Security:** True server-side authorization on every request—users cannot access other users' data
2. **User Isolation:** Cloud Function enforces device ownership before returning any metrics
3. **Customization:** Full control over chart styling, branding, and UX
4. **No GCP Console Access:** Users never interact with GCP Console, stays fully in-app
5. **Standard Pattern:** This is how Firebase/web apps typically handle user-specific metrics
6. **Maintainable:** ~200-300 lines of well-structured code following existing patterns

#### Trade-offs Accepted

- **More code:** ~300 lines vs. ~100 lines for embedded dashboard
- **API costs:** ~$0.26 per 1M queries (negligible at expected scale)
- **Maintenance:** Small ongoing maintenance for chart library and Cloud Function
- **Feature development:** Must build features ourselves vs. using GCP Console features

#### Why Not Embedded Dashboard?

Embedded GCP dashboards require either:

- **Public access:** Anyone with URL can view any device's metrics (security issue)
- **GCP authentication:** Users must sign into GCP Console (poor UX)

Neither option provides proper user isolation for a multi-tenant application.

See [Appendix A](#appendix-a-alternative-approaches-considered) for detailed analysis of alternatives.

---

## Architecture

### High-Level Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────────┐
│   Device    │────────▶│ Cloud Func   │────────▶│ Cloud Monitoring    │
│   (Pi)      │ Write   │ writeMetrics │         │  (Time Series DB)   │
└─────────────┘         └──────────────┘         └─────────────────────┘
   Custom Token           Service Account              Project-wide
                                                           │
                                                           │ Query
┌─────────────┐         ┌──────────────┐         ┌───────▼─────────────┐
│ Web User    │────────▶│ React Comp   │────────▶│ Cloud Func          │
│ (Browser)   │ View    │  (Recharts)  │ Request │ readMetrics         │
└─────────────┘         └──────────────┘         └─────────────────────┘
   Email/Password       Renders Chart             Verifies Ownership
                        with Data                 Returns Data Points
```

### Data Query Strategy

**Key Insight:** Server-side authorization + client-side rendering = secure, customizable charts

```
Device A page → readMetrics(device-A) → Verify ownership → Return A's data → Render chart
Device B page → readMetrics(device-B) → Verify ownership → Return B's data → Render chart
Device C page → readMetrics(device-C) → Verify ownership → Return C's data → Render chart
```

**Security:** Each request is authorized independently—no way to access another user's data.

### Components

**Infrastructure:**

- Cloud Monitoring (stores metrics from devices)
- Service account credentials (for Cloud Functions to query Monitoring API)

**Application (Backend):**

- Cloud Function: `readMetrics` - Queries Cloud Monitoring API
  - Input: `deviceId`, `timeRange` (e.g., "1d", "7d")
  - Authorization: Verifies user owns device via Firestore
  - Output: Array of data points `[{timestamp, plantId, value}]`
- Core helper: `readMetrics(deviceId, timeRange)` - Calls Cloud Function from client

**Application (Frontend):**

- React Component: `DeviceStats` - Displays charts using Recharts
  - Fetches data via `readMetrics()` helper
  - Renders line chart showing moisture levels over time
  - Supports time range selection (1h, 6h, 24h, 7d)
  - Loading/error states
- Dependency: Recharts (~50KB, React charting library)

**No infrastructure configuration required. All logic in code.**

---

## Security Model

### Principle: Server-Side Authorization on Every Request

Users can **only** view metrics for devices they own. Authorization is enforced server-side on every data request:

1. **Device Registration:** Devices stored at `/users/{uid}/devices/{deviceId}` in Firestore
2. **Client Authentication:** Users authenticate to Firebase on the web UI
3. **Data Query:** `readMetrics()` Cloud Function:
   - Receives user ID from Firebase Auth context (`req.auth.uid`)
   - Receives requested `deviceId` and `timeRange` from client
   - **Verifies ownership:** Checks `users/{uid}/devices/{deviceId}` exists in Firestore
   - **Queries metrics:** Only if verification succeeds, queries Cloud Monitoring API
   - **Returns data:** Only data points for the authorized device
4. **Client Rendering:** React component receives data and renders chart

### Security Guarantees

✅ **True data isolation:** Users cannot access other users' data under any circumstances
✅ **Server-side enforcement:** Authorization happens in Cloud Function, not client
✅ **No URL tampering:** Data is fetched via authenticated function call, not URL parameters
✅ **Audit trail:** All requests logged with user ID and device ID
✅ **Firestore rules respected:** Leverages existing device ownership model

### Attack Scenarios

**Scenario 1: User requests another user's device**

```
User A calls readMetrics({deviceId: "device-B"})
→ Cloud Function checks: users/userA/devices/device-B exists?
→ Does not exist
→ Throws HttpsError("permission-denied")
→ No data returned
```

**Scenario 2: User modifies client code to bypass checks**

```
User modifies React component to skip authorization
→ Still calls readMetrics() Cloud Function
→ Cloud Function enforces authorization server-side
→ No data returned
```

**Result:** Full security isolation. This is the standard pattern for multi-tenant Firebase applications.

## Implementation Plan

### Phase 1: Backend - Cloud Function & Schemas

**Estimated Time:** 45 minutes

#### Step 1: Add Schemas to Core Package

**File:** `packages/core/src/schemas.ts`

Add request/response schemas for readMetrics:

```typescript
export const ReadMetricsRequestSchema = z.object({
  deviceId: DeviceId,
  timeRange: z.enum(["1h", "6h", "24h", "7d"]).default("24h"),
});

export type ReadMetricsRequest = z.infer<typeof ReadMetricsRequestSchema>;

export const MetricDataPointResponseSchema = z.object({
  timestamp: z.number().int().positive(),
  plantId: z.string(),
  value: z.number(),
});

export type MetricDataPointResponse = z.infer<
  typeof MetricDataPointResponseSchema
>;

export const ReadMetricsResponseSchema = z.object({
  dataPoints: z.array(MetricDataPointResponseSchema),
});

export type ReadMetricsResponse = z.infer<typeof ReadMetricsResponseSchema>;
```

#### Step 2: Create Cloud Function `readMetrics`

**File:** `packages/functions/src/read-metrics.ts`

```typescript
import {
  ReadMetricsRequestSchema,
  type ReadMetricsRequest,
  type ReadMetricsResponse,
} from "@overdrip/core/schemas";
import { HttpsError, onCall } from "firebase-functions/https";
import { error, info } from "firebase-functions/logger";
import { app } from "./firebase";
import { MetricServiceClient } from "@google-cloud/monitoring";

const metricsClient = new MetricServiceClient();

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

    // Query Cloud Monitoring
    const projectId = await app.firestore().app.options.projectId;
    const request = {
      name: `projects/${projectId}`,
      filter: `metric.type="custom.googleapis.com/overdrip/moisture" AND metric.label.device_id="${deviceId}"`,
      interval: {
        startTime: { seconds: Math.floor(startTime / 1000) },
        endTime: { seconds: Math.floor(now / 1000) },
      },
    };

    const [timeSeries] = await metricsClient.listTimeSeries(request);

    // Transform data points
    const dataPoints = [];
    for (const series of timeSeries) {
      const plantId = series.metric?.labels?.plant_id || "unknown";
      for (const point of series.points || []) {
        if (point.interval?.endTime && point.value?.doubleValue !== undefined) {
          dataPoints.push({
            timestamp: point.interval.endTime.seconds * 1000,
            plantId,
            value: point.value.doubleValue,
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
```

#### Step 3: Create Helper in Core Package

**File:** `packages/core/src/metrics.ts` (add to existing file)

```typescript
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type {
  ReadMetricsRequest,
  ReadMetricsResponse,
  MetricDataPointResponse,
} from "./schemas";

export const readMetrics = async (
  deviceId: string,
  timeRange: "1h" | "6h" | "24h" | "7d" = "24h",
): Promise<MetricDataPointResponse[]> => {
  const readMetricsFn = httpsCallable<ReadMetricsRequest, ReadMetricsResponse>(
    functions,
    "readMetrics",
  );

  const response = await readMetricsFn({ deviceId, timeRange });
  return response.data.dataPoints;
};
```

#### Step 4: Export Function

**File:** `packages/functions/src/index.ts`

```typescript
export * from "./create-custom-token";
export * from "./register-device";
export * from "./write-metrics";
export * from "./read-metrics";
```

### Phase 2: Frontend - React Component with Recharts

**Estimated Time:** 1 hour

#### Step 1: Install Recharts

```bash
cd packages/web
bun add recharts
```

#### Step 2: Create DeviceStats Component

**File:** `packages/web/src/components/devices/device-stats.tsx`

```tsx
import { useEffect, useState } from "react";
import {
  Card,
  Stack,
  Text,
  Alert,
  Group,
  Loader,
  SegmentedControl,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { readMetrics } from "@overdrip/core/metrics";
import type { DeviceRegistration } from "@overdrip/core/device";
import type { MetricDataPointResponse } from "@overdrip/core/schemas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DeviceStatsProps {
  device: DeviceRegistration;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

const DeviceStats = ({ device }: DeviceStatsProps) => {
  const [dataPoints, setDataPoints] = useState<MetricDataPointResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await readMetrics(device.id, timeRange);
        setDataPoints(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load metrics");
        setDataPoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [device.id, timeRange]);

  if (loading) {
    return (
      <Card withBorder padding="lg">
        <Stack gap="md" align="center">
          <Loader />
          <Text size="sm" c="dimmed">
            Loading metrics...
          </Text>
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle />} color="red" title="Error">
        <Text size="sm">{error}</Text>
      </Alert>
    );
  }

  // Group data by plant
  const plantData = dataPoints.reduce(
    (acc, point) => {
      if (!acc[point.plantId]) {
        acc[point.plantId] = [];
      }
      acc[point.plantId].push(point);
      return {};
    },
    {} as Record<string, MetricDataPointResponse[]>,
  );

  // Transform for Recharts
  const chartData = dataPoints
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((point) => ({
      timestamp: point.timestamp,
      [point.plantId]: point.value,
    }));

  // Merge points with same timestamp
  const mergedData = Object.values(
    chartData.reduce(
      (acc, item) => {
        const key = item.timestamp;
        if (!acc[key]) {
          acc[key] = { timestamp: key };
        }
        Object.assign(acc[key], item);
        return acc;
      },
      {} as Record<number, any>,
    ),
  );

  const plantIds = Object.keys(plantData);

  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" fw={500}>
              Soil Moisture Levels
            </Text>
            <Text size="xs" c="dimmed">
              {device.name}
            </Text>
          </div>
          <SegmentedControl
            value={timeRange}
            onChange={(value) => setTimeRange(value as TimeRange)}
            data={[
              { label: "1h", value: "1h" },
              { label: "6h", value: "6h" },
              { label: "24h", value: "24h" },
              { label: "7d", value: "7d" },
            ]}
          />
        </Group>

        {mergedData.length === 0 ? (
          <Text c="dimmed" size="sm">
            No data available for this time range.
          </Text>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) =>
                  new Date(ts).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <YAxis
                label={{
                  value: "Moisture (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
                domain={[0, 100]}
              />
              <Tooltip
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
                formatter={(value) => [`${value}%`, "Moisture"]}
              />
              <Legend />
              {plantIds.map((plantId, index) => (
                <Line
                  key={plantId}
                  type="monotone"
                  dataKey={plantId}
                  stroke={`hsl(${(index * 360) / plantIds.length}, 70%, 50%)`}
                  name={`Plant ${plantId}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Stack>
    </Card>
  );
};

export default DeviceStats;
```

#### Step 3: Integrate into Device Details Page

**File:** `packages/web/src/components/devices/device-detail-page.tsx` (add import and component)

```tsx
import DeviceStats from "./device-stats";

// In your device details page JSX:
<DeviceStats device={device} />;
```

### Phase 3: Testing

**Estimated Time:** 30 minutes

See [Testing Strategy](#testing-strategy) section for details.

---

## Environment Configuration

### Server-Side Configuration (Cloud Functions)

Dashboard ID is hardcoded in the Cloud Function, no environment variables needed for this.

### Client-Side Configuration

No environment variables needed on the web client. The `getDashboardUrl()` function handles all server-side configuration.

### Required Firebase Configuration (Still Needed)

```bash
# ============================================
# Firebase Configuration (Required)
# ============================================
OVERDRIP_FIREBASE_API_KEY=...
OVERDRIP_FIREBASE_AUTH_DOMAIN=...
OVERDRIP_FIREBASE_PROJECT_ID=...
OVERDRIP_FIREBASE_STORAGE_BUCKET=...
OVERDRIP_FIREBASE_MESSAGING_SENDER_ID=...
OVERDRIP_FIREBASE_APP_ID=...

# ============================================
# Environment Mode
# ============================================
NODE_ENV=production
```

### Configuration Notes

**Important:** Dashboard ID is now server-side only—never exposed to client.

**Who configures what:**

| Variable                 | Where                  | Who Sets       | When       | Frequency |
| ------------------------ | ---------------------- | -------------- | ---------- | --------- |
| `OVERDRIP_FIREBASE_*`    | `.env.production`      | Operator/Admin | Deployment | Once      |
| Dashboard ID (hardcoded) | `get-dashboard-url.ts` | Operator/Admin | Deployment | Once      |
| `NODE_ENV`               | `.env.production`      | Operator/Admin | Deployment | Once      |

**End users configure:** Nothing! Dashboard URL is fetched server-side on demand.

### File Locations

```
packages/web/.env              # Local development
packages/web/.env.production   # Production deployment
packages/functions/src/get-dashboard-url.ts  # Dashboard ID hardcoded here
```

---

## Deployment

### Deployment Checklist

- [x] Create Cloud Monitoring dashboard in GCP Console (ID: `0f747e66-1ab0-4953-be81-05441b1a701f`)
- [ ] Update `getDashboardUrl` Cloud Function with dashboard ID
- [ ] Deploy functions: `cd packages/functions && bun run build && firebase deploy --only functions`
- [ ] Build web app: `cd packages/web && NODE_ENV=production bun run build`
- [ ] Deploy to hosting platform
- [ ] Test with real device
- [ ] Verify dashboard loads with correct device filter

### Deployment Script

```bash
#!/bin/bash
# deploy-stats.sh

set -e

echo "Building and deploying Cloud Functions..."
cd packages/functions
bun run build
firebase deploy --only functions

echo "Building and deploying web app..."
cd ../web
NODE_ENV=production bun run build
firebase deploy --only hosting

echo "Deployment complete!"
```

### Rollback Plan

If dashboard does not load:

1. Check Cloud Function logs: `gcloud functions describe getDashboardUrl`
2. Verify dashboard ID in source code: `grep DASHBOARD_ID packages/functions/src/get-dashboard-url.ts`
3. Check Firebase Auth context is available
4. Verify device ownership in Firestore
5. Test Cloud Function directly: `firebase functions:shell` → `getDashboardUrl({deviceId: "test"})`

---

## Testing Strategy

### Unit Tests

**Cloud Function Tests:**

File: `packages/functions/src/get-dashboard-url.test.ts`

```typescript
import { expect } from "chai";
import * as testing from "firebase-functions-test";

describe("getDashboardUrl", () => {
  it("returns dashboard URL for device owned by user", async () => {
    // Test setup: create user and device in Firestore
    // Call function with valid deviceId
    // Verify returned URL contains device_id filter
  });

  it("throws permission-denied for device not owned by user", async () => {
    // Test setup: user without device
    // Call function with another user's deviceId
    // Expect HttpsError with permission-denied
  });

  it("throws unauthenticated when user not authenticated", async () => {
    // Call function without auth context
    // Expect HttpsError with unauthenticated
  });

  it("includes correct dashboard ID and project ID in URL", async () => {
    // Verify URL structure
  });
});
```

### Integration Tests

**Manual Testing (Required):**

1. Authentication handling
   - [ ] Unauthenticated user gets error
   - [ ] Authenticated user gets URL

2. Authorization
   - [ ] User can access their own device dashboard
   - [ ] User cannot access another user's device dashboard
   - [ ] Error message is clear (permission-denied)

3. URL construction
   - [ ] URL includes correct dashboard ID
   - [ ] URL includes correct project ID
   - [ ] URL includes device_id filter parameter
   - [ ] URL is properly encoded

4. React component
   - [ ] Component shows loading state while fetching URL
   - [ ] Dashboard iframe loads successfully
   - [ ] "Open Full Dashboard" link works
   - [ ] Error handling: shows error message if Cloud Function fails
   - [ ] Component mounts/unmounts cleanly

5. End-to-end
   - [ ] Register test device
   - [ ] Navigate to device detail page
   - [ ] Dashboard loads with correct metrics
   - [ ] Multiple devices show isolated data
   - [ ] Refresh page—dashboard still loads

### Performance Testing

**Metrics:**

- Cloud Function response time: <200ms (warm)
- Firestore ownership check: <100ms
- Total dashboard URL retrieval: <300ms
- Iframe load: ~1 second (GCP-controlled)
- Component render: <50ms

---

## Future Enhancements

### Short Term (Next Quarter)

- [ ] Add time range selector (1h, 6h, 24h, 7d, 30d)
- [ ] Support multiple metric types (temperature, pump events)
- [ ] Add "Refresh Dashboard" button
- [ ] Improve loading state UX

### Medium Term (Next 6 Months)

- [ ] Create per-device dashboard customization
- [ ] Add dashboard templates for different plant types
- [ ] Export functionality (CSV, PNG)
- [ ] Mobile-responsive dashboard layout

### Long Term (Next Year)

- [ ] Real-time updates via WebSocket
- [ ] Comparison between multiple devices
- [ ] Alerting integration (email/SMS on threshold breach)
- [ ] Historical analysis (monthly, yearly trends)

---

## Appendices

### Appendix A: Alternative Approaches Considered

#### Alternative 1: Link to GCP Metrics Explorer

**Description:** Simple button/link that opens GCP Metrics Explorer in new tab.

**Pros:**

- Simplest possible implementation (~50 lines)
- Zero setup required
- Free (no API calls)
- Full GCP features available

**Cons:**

- User leaves the app (poor UX)
- Requires GCP Console access
- Not white-label friendly

**Verdict:** Rejected due to poor UX (external navigation). Suitable for MVP/debugging only.

---

#### Alternative 2: Custom Charts with Recharts

**Description:** Build custom charts using Recharts library, query Cloud Monitoring via custom Cloud Function.

**Pros:**

- Complete control over styling/branding
- Integrated UX (matches app design)
- White-label ready
- Offline capable (with caching)

**Cons:**

- High complexity (~500 lines of code)
- New dependency (Recharts ~50KB)
- API costs (~$0.26 per 1M queries)
- Ongoing maintenance burden
- Requires additional Cloud Function (`readMetrics`)
- Feature lag behind GCP updates

**Components Required:**

- Cloud Function: `readMetrics` (with device ownership verification)
- Core schemas: `ReadMetricsRequest/Response`
- Core helper: `readMetrics()` function
- React component with Recharts
- Comprehensive tests

**Verdict:** Rejected due to complexity vs. benefit ratio. Only justified for:

- White-label SaaS products
- Custom analytics requirements
- Offline-first PWA
- Very high traffic (>100K users)

For Overdrip's use case (small-scale IoT), the maintenance burden outweighs benefits.

---

### Appendix B: Security Deep Dive

#### Embedded Dashboard Security Model

**Question:** How do we prevent users from viewing other users' devices?

**Answer:** Multi-layered approach:

1. **Firestore Access Control:**
   - Devices stored at `/users/{uid}/devices/{deviceId}`
   - Firestore rules enforce: `allow read if request.auth.uid == userId`
   - User's web app only retrieves their own devices

2. **Component-Level Protection:**
   - Component receives `device` prop from Firestore query
   - Only constructs dashboard URLs for devices user owns
   - Cannot construct URL without device object

3. **GCP Dashboard Authentication:**
   - For private dashboards: User must authenticate to GCP
   - For public dashboards: Anyone can view (acceptable for non-sensitive metrics)

4. **Attack Scenarios:**

   **Scenario: User guesses another device's ID**

   ```
   User modifies URL manually: ?device_id=someone-elses-device

   Result: Dashboard shows metrics, BUT:
   - If private: User needs GCP authentication (blocked)
   - If public: Shows metrics (acceptable - moisture % not sensitive)
   - Either way: User cannot control device (auth separate)
   ```

   **Mitigation:** If data sensitivity increases, keep dashboards private.

#### Comparison to Custom Charts Security

If we built custom charts with Cloud Function:

```typescript
// Cloud Function would need to verify ownership:
const deviceDoc = await firestore.doc(`users/${uid}/devices/${deviceId}`).get();

if (!deviceDoc.exists) {
  throw new HttpsError("permission-denied", "...");
}
```

This is more secure but adds:

- ~50-100ms latency per request
- Code complexity
- Additional failure points

**Trade-off:** Embedded dashboard accepts slightly relaxed security (public metrics) for significantly lower complexity.

---

### Appendix C: Cost Analysis

#### Embedded Dashboard Approach (Selected)

**Infrastructure Costs:**

- Cloud Monitoring storage: Free (within quota)
- Dashboard hosting: Free
- Iframe embeds: Free
- API calls: Zero (no client queries)

**Operational Costs:**

- Dashboard creation: 10 min one-time (negligible)
- Dashboard updates: 5 min each (rare)
- Troubleshooting: <1 hour/month

**Total:** $0/month + minimal labor

---

#### Custom Charts Approach (Rejected)

**Infrastructure Costs:**

- Cloud Monitoring API reads: ~$0.26 per 1M data points
- Cloud Function invocations: ~$0.40 per 1M requests
- Firestore reads (ownership verification): ~$0.06 per 100K reads

**Example:** 1000 devices, 10 dashboard views/day/device

- Daily queries: 10,000
- Monthly queries: ~300,000
- Firestore reads: ~300,000
- Cost: ~$0.50/month (infrastructure) + $20/month (development time)

**Operational Costs:**

- Initial development: 2-4 hours
- Ongoing maintenance: 1-2 hours/month
- Bug fixes, security updates, dependency updates

**Total:** ~$0.50/month infrastructure + 2 hours/month labor

---

### Appendix D: Performance Benchmarks

#### Load Time Analysis

**Embedded Dashboard:**

1. HTML/CSS/JS load: ~200ms
2. React component render: ~50ms
3. Iframe load: ~800ms (GCP-controlled)
4. Dashboard render: ~300ms (GCP-controlled)

**Total:** ~1.35 seconds (acceptable)

**Custom Charts:**

1. HTML/CSS/JS load: ~200ms (+ Recharts bundle +50KB)
2. React component render: ~50ms
3. Cloud Function call: ~150ms (warm) / ~1500ms (cold)
4. Firestore ownership check: ~100ms
5. Cloud Monitoring query: ~300ms
6. Data transformation: ~50ms
7. Chart render: ~200ms

**Total:** ~1.05 seconds (warm) / ~2.45 seconds (cold)

**Verdict:** Embedded dashboard is comparable performance with zero maintenance.

---

### Appendix E: Decision Matrix

Comprehensive comparison of all approaches:

| Criteria             | Link to GCP | Embedded Dashboard | Custom Charts            |
| -------------------- | ----------- | ------------------ | ------------------------ |
| **Complexity**       | ⭐ Simplest | ⭐⭐ Simple        | ⭐⭐⭐⭐⭐ Complex       |
| **Setup Time**       | 0 minutes   | 10 minutes         | 2-4 hours                |
| **Code to Maintain** | 50 lines    | 100 lines          | 500+ lines               |
| **Dependencies**     | None        | None               | Recharts, Cloud Function |
| **Stays in App**     | ❌ No       | ✅ Yes             | ✅ Yes                   |
| **Customization**    | None        | Limited            | Full                     |
| **Branding**         | GCP         | GCP                | Custom                   |
| **Maintenance**      | Zero        | Minimal            | High                     |
| **Cost**             | $0          | $0                 | ~$0.50/mo + labor        |
| **API Quota**        | 0           | 0                  | Yes                      |
| **Offline Support**  | ❌          | ❌                 | ✅                       |
| **White-label**      | ❌          | ❌                 | ✅                       |
| **Best For**         | MVP/debug   | Production apps    | SaaS products            |

**Score (1-10, higher better):**

- Link to GCP: 6/10 (simple but poor UX)
- Embedded Dashboard: **9/10** (best balance)
- Custom Charts: 5/10 (powerful but over-engineered)

---

### Appendix F: Troubleshooting Guide

#### Dashboard Shows "No Data"

**Symptoms:** Empty graph, "No data available"

**Causes:**

1. Device hasn't sent metrics yet
2. Time range doesn't include data
3. Wrong device_id filter

**Solutions:**

```bash
# Check if metrics exist in Cloud Monitoring
gcloud monitoring time-series list \
  --filter='metric.type="custom.googleapis.com/overdrip/moisture"' \
  --format=json | grep device_id

# Verify device is sending metrics
cd packages/cli
bun run src/index.ts start  # Check logs for metric emission
```

---

#### Dashboard Not Loading (iframe empty)

**Symptoms:** Blank iframe, loading forever

**Causes:**

1. Wrong dashboard ID in env var
2. Wrong project ID
3. CSP blocking iframe
4. GCP authentication required

**Solutions:**

```bash
# Verify env vars
echo $OVERDRIP_MONITORING_DASHBOARD_ID
echo $OVERDRIP_FIREBASE_PROJECT_ID

# Test dashboard URL directly
open "https://console.cloud.google.com/monitoring/dashboards/custom/$OVERDRIP_MONITORING_DASHBOARD_ID?project=$OVERDRIP_FIREBASE_PROJECT_ID"

# Check browser console for CSP errors
# If CSP blocking: add to index.html:
# <meta http-equiv="Content-Security-Policy" content="frame-src https://console.cloud.google.com;">
```

---

#### Environment Variable Not Found

**Symptoms:** Alert showing "Dashboard not configured"

**Causes:**

1. `.env` file missing variable
2. Server not restarted after env change
3. Wrong file location
4. Typo in variable name

**Solutions:**

```bash
# Verify file location
ls -la packages/web/.env

# Verify variable exists
grep OVERDRIP_MONITORING_DASHBOARD_ID packages/web/.env

# Restart dev server
cd packages/web
# Stop (Ctrl+C), then:
bun run dev

# Verify loading at runtime
bun run -e 'console.log(process.env.OVERDRIP_MONITORING_DASHBOARD_ID)'
```

---

## References

- **Cloud Monitoring Dashboards:** https://cloud.google.com/monitoring/dashboards
- **Dashboard Filtering:** https://cloud.google.com/monitoring/charts#filtering
- **Firestore Security Rules:** https://firebase.google.com/docs/firestore/security/get-started
- **Related Docs:**
  - `SECURITY_METRICS.md` - Security deep dive
  - `packages/core/src/METRICS.md` - Metrics system architecture
  - `.github/copilot-instructions.md` - Development patterns
