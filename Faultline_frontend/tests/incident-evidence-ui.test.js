import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

let server;
let adaptIncident;
let IncidentEvidencePanel;

before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "error",
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
  });
  ({ adaptIncident } = await server.ssrLoadModule("/src/api/adapters.js"));
  ({ default: IncidentEvidencePanel } = await server.ssrLoadModule(
    "/src/components/incidents/IncidentEvidencePanel.jsx",
  ));
});

after(async () => {
  await server?.close();
});

const rawIncident = {
  id: "incident-memory",
  title: "Memory Exhaustion",
  summary: "Memory Exhaustion supported by 1 anomaly signal",
  severity: "WARNING",
  status: "OPEN",
  classification: "MEMORY_EXHAUSTION",
  clusterId: "production",
  namespace: "booknest",
  confidence: 0.85,
  firstSeen: "2026-10-01T18:28:54.422Z",
  lastSeen: "2026-10-01T18:28:54.422Z",
  correlationKey: "deployment:production:booknest:booknest-backend",
  primaryResource: {
    scope: "deployment",
    clusterId: "production",
    namespace: "booknest",
    workload: "booknest-backend",
  },
  affectedResources: [],
  anomalies: [
    {
      anomalyId: "anomaly-memory",
      classification: "HIGH_MEMORY_UTILIZATION",
      source: "DETERMINISTIC",
      severity: "WARNING",
      confidence: 0.85,
      timestamp: "2026-10-01T18:28:54.422Z",
      summary: "Memory utilization is 85.34%",
      affectedResource: {
        scope: "container",
        clusterId: "production",
        namespace: "booknest",
        pod: "booknest-backend-abc123",
        container: "backend",
      },
      evidence: [
        {
          type: "calculation",
          summary: "Memory usage divided by limit",
          attributes: {
            utilizationPercent: 85.34,
            warningThresholdPercent: 85,
            criticalThresholdPercent: 95,
          },
        },
      ],
    },
  ],
  evidence: [],
  resourceSnapshots: [
    {
      timestamp: "2026-10-01T18:28:54.422Z",
      observedAt: "2026-10-01T18:28:54.400Z",
      resource: {
        scope: "container",
        clusterId: "production",
        namespace: "booknest",
        pod: "booknest-backend-abc123",
        container: "backend",
      },
      cpuUsageCores: 0.42,
      cpuLimitCores: 1,
      cpuUtilizationPercent: 42,
      memoryUsageBytes: 458227712,
      memoryLimitBytes: 536870912,
      memoryUtilizationPercent: 85.34,
      fieldTimestamps: {},
    },
  ],
  timeline: [],
};

test("incident adapter exposes concrete signal summaries even for an older generic incident", () => {
  const incident = adaptIncident(rawIncident);
  assert.equal(incident.reasonSummary, "Memory utilization is 85.34%");
  assert.equal(incident.signalCount, 1);
});

test("evidence view explains what triggered classification, where, and against which thresholds", () => {
  const incident = adaptIncident(rawIncident);
  const query = {
    data: { anomalyEvidence: [], telemetry: { errorLogs: [], kubernetesEvents: [], metrics: [] } },
    loading: false,
    error: null,
    refetch() {},
  };
  const html = renderToStaticMarkup(React.createElement(IncidentEvidencePanel, { query, incident }));

  for (const text of [
    "Why Faultline opened this incident",
    "Primary signal: High Memory Utilization",
    "CPU and memory at incident detection",
    "42.00%",
    "437 MiB",
    "Memory Exhaustion",
    "Memory utilization is 85.34%",
    "booknest-backend-abc123/backend",
    "utilization percent:",
    "85.34%",
    "warning threshold percent:",
    "85.00%",
    "critical threshold percent:",
    "95.00%",
  ]) {
    assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
