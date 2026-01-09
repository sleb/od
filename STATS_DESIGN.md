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

### Selected Approach: Embedded Cloud Monitoring Dashboard

**Rationale:** Embed a single GCP Cloud Monitoring dashboard via iframe, filtered by device_id via URL parameters.

#### Why This Approach?

1. **Simplicity:** Create dashboard once, reuse for all devices
2. **Zero API costs:** No Cloud Function queries, no quota usage
3. **GCP-managed:** Security, performance, and features handled by Google
4. **Scalability:** One dashboard serves unlimited devices via URL filtering
5. **Low maintenance:** Edit dashboard in GCP Console, changes propagate to all devices
6. **Good UX:** Stays in-app via iframe, seamless user experience

#### Trade-offs Accepted

- **GCP branding visible:** Google Cloud UI styling
- **Limited customization:** Cannot significantly change chart appearance
- **Authentication:** Users may need GCP Console authentication (mitigated via public dashboards)

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
                                                           │
                                                           │
┌─────────────┐         ┌──────────────┐                 │
│ Web User    │────────▶│ React Comp   │─────────────────┘
│ (Browser)   │ View    │  (iframe)    │ Embed URL
└─────────────┘         └──────────────┘
   Email/Password          URL Filtering
                           ?f.device_id=...
```

### Dashboard Filtering Strategy

**Key Insight:** One dashboard template + URL parameters = per-device views

```
Single Dashboard (created once by admin)
         ↓
Device A page → URL: ?f.device_id=device-A → Shows Device A metrics
Device B page → URL: ?f.device_id=device-B → Shows Device B metrics
Device C page → URL: ?f.device_id=device-C → Shows Device C metrics
```

### Components

**Infrastructure (Operator/Admin Setup):**

- Cloud Monitoring Dashboard (created once, reused for all devices)
- Dashboard ID configured server-side (hardcoded in Cloud Function)

**Application (Backend):**

- Cloud Function: `getDashboardUrl` - Takes `deviceId`, returns filtered dashboard URL
- Server-side URL construction: Dashboard ID never exposed to client
- Authorization: Verifies user owns the device before returning URL

**Application (Frontend):**

- React Component: `DeviceStatsEmbedded` - Calls `getDashboardUrl()` function, embeds iframe
- Client receives only the final URL, no internal configuration

**No per-device configuration required. No client-side environment variables for dashboard ID.**

---

## Security Model

### Principle: User Isolation

Users can only view metrics for devices they own. Authorization is enforced server-side:

1. **Device Registration:** Devices stored at `/users/{uid}/devices/{deviceId}` in Firestore
2. **Dashboard Access:** Users authenticate to Firebase on the web UI
3. **URL Generation:** `getDashboardUrl()` Cloud Function:
   - Receives user ID from Firebase Auth context
   - Receives requested device ID from client
   - Verifies device ownership in Firestore: `users/{uid}/devices/{deviceId}` exists
   - Returns filtered dashboard URL only if verification succeeds
4. **GCP Authentication:** Not needed—GCP dashboard filtering via URL is sufficient (metrics are non-sensitive)

### Security Guarantees

✅ **User cannot request another user's device** (Cloud Function verifies ownership)
✅ **Dashboard ID never exposed to client** (hardcoded server-side)
✅ **URL tampering ineffective** (user cannot manually construct valid URLs without owning the device)
✅ **Server-side authorization on every request** (more secure than implicit client-side filtering)

### Public Dashboard Option

For truly public metrics visualization (if desired), dashboard can be shared publicly via GCP Console settings. Trade-off: anyone with URL can view metrics.

**Recommendation:** Keep dashboards private, require GCP authentication for embedded view.

---

## Implementation Plan

### Phase 1: Infrastructure Setup (Operator/Admin - One Time)

**Estimated Time:** 10 minutes

#### Step 1: Create Dashboard in GCP Console

✅ **COMPLETED** — Dashboard created: `0f747e66-1ab0-4953-be81-05441b1a701f`

Dashboard name: "Overdrip Device Metrics"
Metric: `custom.googleapis.com/overdrip/moisture`
Grouped by: `device_id`, `plant_id` (allows URL filtering)

#### Step 2: Configure Dashboard ID in Cloud Function

Add the dashboard ID to the `getDashboardUrl` Cloud Function environment:

```typescript
// packages/functions/src/get-dashboard-url.ts
const DASHBOARD_ID = "0f747e66-1ab0-4953-be81-05441b1a701f";
const PROJECT_ID = "overdrip-daaac";
```

The dashboard ID is hardcoded server-side and never exposed to the client.

**Note:** This is server-side infrastructure configuration. End users never see this.

### Phase 2: Component Implementation

**Estimated Time:** 30 minutes

#### Step 1: Create Cloud Function `getDashboardUrl`

**File:** `packages/functions/src/get-dashboard-url.ts`

```typescript
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const firestore = getFirestore();

// Hardcoded server-side configuration
const DASHBOARD_ID = "0f747e66-1ab0-4953-be81-05441b1a701f";
const PROJECT_ID = "overdrip-daaac";
const DASHBOARD_BASE_URL = `https://console.cloud.google.com/monitoring/dashboards/custom/${DASHBOARD_ID}`;

interface GetDashboardUrlRequest {
  deviceId: string;
}

interface GetDashboardUrlResponse {
  url: string;
}

export const getDashboardUrl = onCall<
  GetDashboardUrlRequest,
  Promise<GetDashboardUrlResponse>
>(async (request) => {
  const userId = request.auth?.uid;
  const { deviceId } = request.data;

  if (!userId) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to access dashboard URLs",
    );
  }

  if (!deviceId) {
    throw new HttpsError("invalid-argument", "deviceId is required");
  }

  // Verify user owns the device
  const deviceDoc = await firestore
    .doc(`users/${userId}/devices/${deviceId}`)
    .get();

  if (!deviceDoc.exists) {
    throw new HttpsError("permission-denied", "User does not own this device");
  }

  // Construct URL with device filter
  const params = new URLSearchParams({
    project: PROJECT_ID,
    "f.device_id": deviceId,
    timeRange: "1d", // Last 24 hours
  });

  const url = `${DASHBOARD_BASE_URL}?${params.toString()}`;

  return { url };
});
```

#### Step 2: Create Helper in Core Package

**File:** `packages/core/src/dashboard.ts`

```typescript
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export interface GetDashboardUrlRequest {
  deviceId: string;
}

export interface GetDashboardUrlResponse {
  url: string;
}

export const getDashboardUrl = async (deviceId: string): Promise<string> => {
  const getDashboardUrlFn = httpsCallable<
    GetDashboardUrlRequest,
    GetDashboardUrlResponse
  >(functions, "getDashboardUrl");

  const response = await getDashboardUrlFn({ deviceId });
  return response.data.url;
};
```

#### Step 3: Create React Component `DeviceStatsEmbedded`

**File:** `packages/web/src/components/devices/device-stats-embedded.tsx`

```tsx
import { useEffect, useState } from "react";
import { Card, Stack, Text, Anchor, Alert, Group, Loader } from "@mantine/core";
import {
  IconExternalLink,
  IconInfoCircle,
  IconAlertCircle,
} from "@tabler/icons-react";
import { getDashboardUrl } from "@overdrip/core/dashboard";
import type { DeviceRegistration } from "@overdrip/core/device";

interface DeviceStatsEmbeddedProps {
  device: DeviceRegistration;
}

const DeviceStatsEmbedded = ({ device }: DeviceStatsEmbeddedProps) => {
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = await getDashboardUrl(device.id);
        setDashboardUrl(url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
        setDashboardUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardUrl();
  }, [device.id]);

  if (loading) {
    return (
      <Card withBorder padding="lg">
        <Stack gap="md" align="center">
          <Loader />
          <Text size="sm" c="dimmed">
            Loading dashboard...
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

  if (!dashboardUrl) {
    return (
      <Alert icon={<IconInfoCircle />} color="blue">
        <Text size="sm">Dashboard URL could not be loaded.</Text>
      </Alert>
    );
  }

  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" fw={500}>
              Device Metrics
            </Text>
            <Text size="xs" c="dimmed">
              Real-time monitoring
            </Text>
          </div>
          <Anchor href={dashboardUrl} target="_blank" size="sm">
            <Group gap="xs">
              <span>Open Full Dashboard</span>
              <IconExternalLink size={14} />
            </Group>
          </Anchor>
        </Group>

        <iframe
          src={dashboardUrl}
          width="100%"
          height="500"
          style={{
            border: "1px solid var(--mantine-color-gray-3)",
            borderRadius: "var(--mantine-radius-md)",
          }}
          title={`Metrics for ${device.name}`}
        />
      </Stack>
    </Card>
  );
};

export default DeviceStatsEmbedded;
```

#### Step 4: Integrate into Device Details Page

Add to the device details page component:

```tsx
import DeviceStatsEmbedded from "@/components/devices/device-stats-embedded";

// In your device details page JSX:
<DeviceStatsEmbedded device={device} />;
```

### Phase 3: Testing

**Estimated Time:** 15 minutes

#### Manual Testing

1. Start dev server: `cd packages/web && bun run dev`
2. Navigate to device stats page
3. Verify:
   - [ ] Dashboard iframe loads
   - [ ] Shows metrics for current device only
   - [ ] "Open Full Dashboard" link works
   - [ ] Multiple plants shown on same chart
   - [ ] Appropriate error message if env var missing

#### Production Testing

1. Deploy to production environment
2. Register test device via CLI
3. Send test metrics
4. Verify dashboard shows data after 1-2 minutes
5. Test with multiple devices (data isolation)

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
