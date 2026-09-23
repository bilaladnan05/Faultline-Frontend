import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";
import { reportingKeys } from "../src/hooks/useReporting.js";
import { createReportingRange } from "../src/components/reporting/reportingRange.js";

let server;
let ReportingMetricCards;
let ReportingAnalyticsDashboard;

before(async () => {
  server = await createServer({ configFile: false, logLevel: "error", plugins: [react()], server: { middlewareMode: true, hmr: false } });
  ({ default: ReportingMetricCards } = await server.ssrLoadModule("/src/components/reporting/ReportingMetricCards.jsx"));
  ({ default: ReportingAnalyticsDashboard } = await server.ssrLoadModule("/src/components/reporting/ReportingAnalyticsDashboard.jsx"));
});

after(async () => {
  await server?.close();
});

const analyticsData = {
  range: { from: "2026-09-14T00:00:00.000Z", to: "2026-09-21T00:00:00.000Z" },
  totalIncidents: 38,
  openIncidents: 4,
  resolvedIncidents: 34,
  criticalIncidents: 6,
  incidentsBySeverity: { CRITICAL: 6, HIGH: 10, WARNING: 14, INFO: 8 },
  incidentsByStatus: { OPEN: 4, RESOLVED: 34 },
  incidentsByClassification: {},
  incidentsByService: {},
  resolutionRate: 0.8947,
  mttrMs: 742_000,
  mttaMs: 83_000,
};

const trendsData = {
  bucket: "day",
  points: [
    { timestamp: "2026-09-19T00:00:00.000Z", total: 7, critical: 2, resolved: 6 },
    { timestamp: "2026-09-20T00:00:00.000Z", total: 4, critical: 1, resolved: 3 },
  ],
};

const summaryData = {
  generatedAt: "2026-09-21T00:00:00.000Z",
  period: analyticsData.range,
  health: { available: true, overallStatus: "degraded", healthyServices: 12, degradedServices: 2, unhealthyServices: 1 },
  incidents: { total: 38, critical: 6, resolved: 34, unresolved: 4 },
  performance: { mttrMs: 742_000, mttaMs: 83_000 },
  topAffectedServices: [
    { service: "payment-service", incidentCount: 8 },
    { service: "checkout-service", incidentCount: 6 },
  ],
  commonIncidentCategories: [
    { classification: "APPLICATION_DEPENDENCY_FAILURE", incidentCount: 12 },
  ],
  trends: trendsData.points,
};

const query = (data, overrides = {}) => ({ data, loading: false, error: null, refreshing: false, refetch() {}, ...overrides });
const renderMetrics = (data = analyticsData, overrides) => renderToStaticMarkup(React.createElement(ReportingMetricCards, { query: query(data, overrides) }));
const renderDashboard = ({ analytics = query(analyticsData), trends = query(trendsData), summary = query(summaryData) } = {}) => renderToStaticMarkup(React.createElement(ReportingAnalyticsDashboard, { analytics, trends, summary }));

test("total incident count renders", () => assert.match(renderMetrics(), /Total Incidents[\s\S]*38/));
test("open incident count renders", () => assert.match(renderMetrics(), /Open Incidents[\s\S]*4/));
test("resolved incident count renders", () => assert.match(renderMetrics(), /Resolved Incidents[\s\S]*34/));
test("critical incident count renders", () => assert.match(renderMetrics(), /Critical Incidents[\s\S]*6/));
test("MTTR renders the backend duration in the existing format", () => assert.match(renderMetrics(), /MTTR[\s\S]*00:12:22/));
test("null MTTR renders N/A", () => assert.match(renderMetrics({ ...analyticsData, mttrMs: null }), /MTTR[\s\S]*N\/A/));
test("MTTA renders the backend duration", () => assert.match(renderMetrics(), /MTTA[\s\S]*00:01:23/));
test("resolution rate renders from the backend ratio", () => assert.match(renderMetrics(), /Resolution Rate[\s\S]*89\.5%/));

test("system health and backend service counts render", () => {
  const html = renderDashboard();
  assert.match(html, /System Health/);
  assert.match(html, /Degraded/);
  assert.match(html, /Healthy[\s\S]*12/);
  assert.match(html, /Unhealthy[\s\S]*1/);
});

test("unavailable health is explicit rather than healthy", () => {
  const html = renderDashboard({ summary: query({ ...summaryData, health: { ...summaryData.health, available: false } }) });
  assert.match(html, /System health unavailable/);
});

test("incident trend receives and exposes backend points", () => {
  const html = renderDashboard();
  assert.match(html, /Backend-provided day buckets/);
  assert.match(html, /Incident frequency values/);
  assert.match(html, />7<\/td>/);
  assert.match(html, />2<\/td>/);
});

test("severity breakdown uses backend-provided counts", () => {
  const html = renderDashboard();
  assert.match(html, /Incidents by Severity/);
  assert.match(html, /CRITICAL[\s\S]*6/);
  assert.match(html, /WARNING[\s\S]*14/);
});

test("top affected services and returned categories render", () => {
  const html = renderDashboard();
  assert.match(html, /payment-service[\s\S]*8/);
  assert.match(html, /checkout-service[\s\S]*6/);
  assert.match(html, /Application Dependency Failure[\s\S]*12/);
});

test("zero-incident periods render useful empty states", () => {
  const html = renderDashboard({
    analytics: query({ ...analyticsData, totalIncidents: 0, openIncidents: 0, resolvedIncidents: 0, criticalIncidents: 0, mttrMs: null, mttaMs: null, resolutionRate: 0, incidentsBySeverity: {} }),
    trends: query({ bucket: "day", points: [] }),
    summary: query({ ...summaryData, topAffectedServices: [], commonIncidentCategories: [] }),
  });
  assert.match(html, /Total Incidents[\s\S]*0/);
  assert.match(html, /No incidents recorded in this period/);
  assert.match(html, /No affected services in this period/);
});

test("changing date range produces new bounded backend query keys", () => {
  const anchor = Date.parse("2026-09-21T00:00:00.000Z");
  const day = createReportingRange("24h", anchor);
  const month = createReportingRange("30d", anchor);
  assert.notEqual(day.from, month.from);
  assert.equal(day.bucket, "hour");
  assert.equal(month.bucket, "day");
  assert.notDeepEqual(reportingKeys.analytics(day), reportingKeys.analytics(month));
});

test("analytics failure does not destroy health, trend, or service sections", () => {
  const html = renderDashboard({ analytics: query(null, { error: new Error("analytics failed") }) });
  assert.match(html, /Incident analytics unavailable/);
  assert.match(html, /System Health/);
  assert.match(html, /Incident Frequency/);
  assert.match(html, /payment-service/);
});
