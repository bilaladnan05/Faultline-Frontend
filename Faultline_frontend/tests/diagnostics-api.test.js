import test from "node:test";
import assert from "node:assert/strict";
import {
  getIncidentCitation,
  getIncidentDiagnosisContext,
  investigateIncident,
  runDiagnosticTest,
} from "../src/api/endpoints.js";

const calls = [];
const originalFetch = globalThis.fetch;

test.beforeEach(() => {
  calls.length = 0;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
});

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("diagnostic endpoints preserve exact scoped route identifiers", async () => {
  const scope = {
    projectId: "project/1",
    incidentId: "incident/1",
    incidentRevisionId: "revision/1",
    evidenceSnapshotId: "snapshot/1",
  };
  await investigateIncident(scope);
  await runDiagnosticTest(scope, {
    testId: "kubectl_get_pod",
    request: "inspect pod status",
  });
  await getIncidentCitation(scope, "citation/1");
  await getIncidentDiagnosisContext(scope.projectId, scope.incidentId);

  assert.deepEqual(
    calls.map(({ url, init }) => ({ url, method: init.method })),
    [
      { url: "/api/projects/project%2F1/incidents/incident%2F1/revisions/revision%2F1/evidence-snapshots/snapshot%2F1/diagnostics", method: "POST" },
      { url: "/api/projects/project%2F1/incidents/incident%2F1/revisions/revision%2F1/evidence-snapshots/snapshot%2F1/diagnostic-tests", method: "POST" },
      { url: "/api/incidents/incident%2F1/revisions/revision%2F1/evidence-snapshots/snapshot%2F1/citations/citation%2F1", method: "GET" },
      { url: "/api/projects/project%2F1/incidents/incident%2F1/diagnosis-context", method: "GET" },
    ],
  );
});

test("blob exports send the HttpOnly session cookie", async () => {
  const { apiGetBlob } = await import("../src/api/client.js");
  await apiGetBlob("/reports/system-summary/export", undefined);
  assert.equal(calls[0].init.credentials, "include");
});
