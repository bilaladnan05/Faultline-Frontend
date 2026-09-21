import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiError } from "../src/api/client.js";
import {
  exportIncidentReport,
  getIncidentAnalytics,
  getIncidentReport,
  getIncidentSlackTicket,
  getIncidentTrends,
  getSystemSummary,
} from "../src/api/reporting.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function respond(body = {}, init = {}) {
  globalThis.fetch = async (url, options) => {
    respond.last = { url: String(url), options };
    return new Response(
      typeof body === "string" || body instanceof Blob ? body : JSON.stringify(body),
      { status: 200, headers: { "content-type": "application/json", ...(init.headers ?? {}) }, ...init },
    );
  };
}

test("getIncidentReport calls the encoded incident report route", async () => {
  respond({ reportId: "report-1" });
  await getIncidentReport("incident/id");
  assert.equal(respond.last.url, "/api/reports/incidents/incident%2Fid");
});

test("getIncidentSlackTicket calls the safe metadata route", async () => {
  respond({ ticket: null });
  await getIncidentSlackTicket("incident/id");
  assert.equal(respond.last.url, "/api/incidents/incident%2Fid/external-tickets/slack");
});

test("analytics serializes date filters as ISO 8601", async () => {
  respond({ totalIncidents: 0 });
  await getIncidentAnalytics({ from: new Date("2026-09-01T00:00:00Z"), to: "2026-09-21T12:30:00+05:00" });
  const url = new URL(respond.last.url, "http://frontend.test");
  assert.equal(url.pathname, "/api/analytics/incidents");
  assert.equal(url.searchParams.get("from"), "2026-09-01T00:00:00.000Z");
  assert.equal(url.searchParams.get("to"), "2026-09-21T07:30:00.000Z");
});

test("trends include the backend bucket and bounded range", async () => {
  respond({ bucket: "day", points: [] });
  await getIncidentTrends({ from: "2026-09-01T00:00:00Z", to: "2026-09-21T00:00:00Z", bucket: "day" });
  const url = new URL(respond.last.url, "http://frontend.test");
  assert.equal(url.pathname, "/api/analytics/incidents/trends");
  assert.equal(url.searchParams.get("bucket"), "day");
});

test("system summary calls its report route", async () => {
  respond({ generatedAt: "2026-09-21T00:00:00Z" });
  await getSystemSummary({ from: "2026-09-01T00:00:00Z", to: "2026-09-21T00:00:00Z" });
  assert.match(respond.last.url, /^\/api\/reports\/system-summary\?/);
});

for (const [format, contentType] of [["pdf", "application/pdf"], ["csv", "text/csv"]]) {
  test(`${format.toUpperCase()} export returns a Blob and response filename`, async () => {
    respond("file-content", {
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="incident-report.${format}"`,
      },
    });
    const result = await exportIncidentReport("abc", format);
    assert.ok(result.blob instanceof Blob);
    assert.equal(result.filename, `incident-report.${format}`);
    assert.equal(result.contentType, contentType);
    assert.match(respond.last.url, new RegExp(`/api/reports/incidents/abc/export\\?format=${format}$`));
  });
}

test("JSON export downloads the exact backend response with a safe fallback filename", async () => {
  respond(JSON.stringify({ reportId: "report-1" }), {
    headers: { "content-type": "application/json" },
  });
  const result = await exportIncidentReport("incident/id", "json");
  assert.ok(result.blob instanceof Blob);
  assert.equal(await result.blob.text(), JSON.stringify({ reportId: "report-1" }));
  assert.equal(result.filename, "faultline-incident-incident-id.json");
});

test("export rejects a successful response with the wrong file type", async () => {
  respond(JSON.stringify({ message: "not a PDF" }), {
    headers: { "content-type": "application/json" },
  });
  await assert.rejects(exportIncidentReport("abc", "pdf"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 502);
    return true;
  });
});

test("reporting failures preserve the existing ApiError path", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "Incident not found" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
  await assert.rejects(getIncidentReport("missing"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 404);
    assert.equal(error.isNotFound, true);
    return true;
  });
});
