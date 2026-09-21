import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

let server;
let IncidentTechnicalReport;
let IncidentHeader;
let IncidentTimeline;
let IncidentReportExportActions;

before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "error",
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
  });
  ({ default: IncidentTechnicalReport } = await server.ssrLoadModule(
    "/src/components/incidents/IncidentTechnicalReport.jsx",
  ));
  ({ default: IncidentHeader } = await server.ssrLoadModule(
    "/src/components/incidents/IncidentHeader.jsx",
  ));
  ({ default: IncidentTimeline } = await server.ssrLoadModule(
    "/src/components/incidents/IncidentTimeline.jsx",
  ));
  ({ default: IncidentReportExportActions } = await server.ssrLoadModule(
    "/src/components/incidents/IncidentReportExportActions.jsx",
  ));
});

after(async () => {
  await server?.close();
});

const report = {
  reportId: "report-1",
  generatedAt: "2026-09-21T12:30:00.000Z",
  incident: {
    id: "INC-1032",
    title: "Payment Processing Failure",
    severity: "CRITICAL",
    status: "RESOLVED",
    classification: "APPLICATION_DEPENDENCY_FAILURE",
    clusterId: "production",
    detectedAt: "2026-09-21T14:03:00.000Z",
    acknowledgedAt: "2026-09-21T14:05:00.000Z",
    resolvedAt: "2026-09-21T14:24:00.000Z",
    durationMs: 1_260_000,
    affectedServices: ["payment-service", "checkout-service"],
  },
  summary: {
    description: "Repeated payment-provider timeouts caused checkout requests to fail.",
    suspectedCause: "Upstream provider timeout",
    rootCause: "External payment API degradation",
  },
  anomalies: {
    total: 12,
    byClassification: { DEPENDENCY_TIMEOUT: 8, LATENCY_ANOMALY: 4 },
    bySource: {},
    bySeverity: {},
    byStatus: {},
  },
  codeAnalysis: {
    totalFindings: 2,
    criticalFindings: 1,
    findings: [
      {
        id: "finding-1",
        severity: "CRITICAL",
        title: "Missing timeout fallback",
        description: "The provider call has no fallback path.",
        location: "payment/client.ts:84",
      },
      { id: "finding-2", severity: "HIGH", title: "Retry policy may amplify failures" },
    ],
  },
  remediation: {
    suggested: [{ id: "rem-1", title: "Add timeout fallback", description: "Return a safe retry response." }],
    executed: [{ id: "rem-2", title: "Circuit breaker enabled", occurredAt: "2026-09-21T14:18:00.000Z" }],
  },
  health: {
    services: [
      { service: "payment-service", status: "DEGRADED", summary: "Elevated upstream failures" },
      { service: "checkout-service", status: "HEALTHY" },
    ],
  },
  timeline: [
    {
      id: "timeline-1",
      timestamp: "2026-09-21T14:03:00.000Z",
      type: "ANOMALY_OPENED",
      anomalyId: "anomaly-1",
      classification: "DEPENDENCY_TIMEOUT",
      source: "LOG_CLASSIFIER",
      severity: "CRITICAL",
      summary: "Incident detected",
    },
  ],
};

function render(query) {
  return renderToStaticMarkup(React.createElement(IncidentTechnicalReport, { query }));
}

test("enhanced incident header renders title, severity, status, affected services, and timing", () => {
  const incident = {
    id: report.incident.id,
    title: report.incident.title,
    severity: report.incident.severity,
    status: "Resolved",
    classificationLabel: "Application Dependency Failure",
    summary: report.summary.description,
    service: "payment-service",
    clusterId: "production",
    namespace: "checkout",
    impact: "2 workloads",
    elapsedTime: "00:21:00",
    confidence: 96,
    firstSeen: report.incident.detectedAt,
    lastSeen: report.incident.resolvedAt,
    resolvedAt: report.incident.resolvedAt,
  };
  const html = renderToStaticMarkup(React.createElement(IncidentHeader, { incident, report }));
  for (const visibleText of [
    "Payment Processing Failure",
    "INC-1032",
    "CRITICAL",
    "Resolved",
    "payment-service",
    "checkout-service",
    "Detected",
    "Acknowledged",
    "Resolved",
    "00:21:00",
  ]) {
    assert.match(html, new RegExp(visibleText));
  }
});

test("technical report renders backend summary, metrics, anomalies, findings, remediation, and health", () => {
  const html = render({ data: report, loading: false, error: null, refetch() {} });
  for (const visibleText of [
    "Payment Processing Failure",
    "INC-1032",
    "Repeated payment-provider timeouts",
    "00:21:00",
    "Dependency Timeout",
    "Latency Anomaly",
    "Missing timeout fallback",
    "payment/client.ts:84",
    "Add timeout fallback",
    "Circuit breaker enabled",
    "payment-service",
    "Degraded",
    "checkout-service",
    "Healthy",
  ]) {
    assert.match(html, new RegExp(visibleText));
  }
});

test("technical report exposes accessible PDF, CSV, and JSON export actions", () => {
  const html = render({ data: report, loading: false, error: null, refetch() {} });
  assert.match(html, /aria-label="Export incident report as PDF"/);
  assert.match(html, /aria-label="Export incident report as CSV"/);
  assert.match(html, /aria-label="Export incident report as JSON"/);
});

test("pending export state disables duplicate actions", () => {
  const html = renderToStaticMarkup(React.createElement(IncidentReportExportActions, {
    pendingFormat: "pdf",
    onExport() {},
  }));
  assert.match(html, /Generating PDF\.\.\./);
  assert.equal((html.match(/disabled=""/g) ?? []).length, 3);
});

test("normalized report timeline renders through the shared incident timeline", () => {
  const html = renderToStaticMarkup(React.createElement(IncidentTimeline, { entries: report.timeline }));
  assert.match(html, /ANOMALY OPENED/);
  assert.match(html, /Incident detected/);
  assert.match(html, /CRITICAL/);
});

test("large findings and timelines use accessible native disclosure controls", () => {
  const findings = Array.from({ length: 21 }, (_, index) => ({
    id: `finding-${index}`,
    severity: "INFO",
    title: `Finding ${index}`,
  }));
  const entries = Array.from({ length: 51 }, (_, index) => ({
    ...report.timeline[0],
    id: `timeline-${index}`,
    summary: `Timeline event ${index}`,
  }));
  const reportHtml = render({
    data: { ...report, codeAnalysis: { totalFindings: 21, criticalFindings: 0, findings } },
    loading: false,
    error: null,
    refetch() {},
  });
  const timelineHtml = renderToStaticMarkup(React.createElement(IncidentTimeline, { entries }));
  assert.match(reportHtml, /Show 1 more findings/);
  assert.match(timelineHtml, /Show 1 earlier timeline events/);
  assert.match(timelineHtml, /Timeline event 50/);
});

test("technical report renders clear unavailable states for optional data", () => {
  const empty = {
    ...report,
    summary: { description: "Brief incident.", suspectedCause: null, rootCause: null },
    anomalies: { ...report.anomalies, total: 0, byClassification: {} },
    codeAnalysis: { totalFindings: 0, criticalFindings: 0, findings: [] },
    remediation: { suggested: [], executed: [] },
    health: { services: [] },
  };
  const html = render({ data: empty, loading: false, error: null, refetch() {} });
  for (const visibleText of [
    "Not identified",
    "Root cause not confirmed",
    "No anomalies recorded for this incident.",
    "No code analysis findings available.",
    "No remediation actions recorded.",
    "Service health data unavailable.",
  ]) {
    assert.match(html, new RegExp(visibleText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("technical report uses a structured loading skeleton", () => {
  const html = render({ data: null, loading: true, error: null, refetch() {} });
  assert.match(html, /aria-label="Loading technical report"/);
  assert.doesNotMatch(html, /Technical report could not be loaded/);
});

test("technical report failure is scoped and retryable", () => {
  const html = render({ data: null, loading: false, error: new Error("failed"), refetch() {} });
  assert.match(html, /Technical report could not be loaded/);
  assert.match(html, /The rest of the incident remains available/);
  assert.match(html, /> Retry</);
});
