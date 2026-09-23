import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { runIncidentReportExport } from "../src/api/incidentReportExport.js";
import { downloadBlob } from "../src/utils/download.js";

test("PDF, CSV, and JSON actions request the matching backend format and trigger download", async () => {
  for (const format of ["pdf", "csv", "json"]) {
    const calls = [];
    const blob = new Blob([format]);
    await runIncidentReportExport({
      incidentId: "INC-1032",
      format,
      request: async (incidentId, requestedFormat) => {
        calls.push([incidentId, requestedFormat]);
        return { blob, filename: `server-report.${format}`, contentType: "application/octet-stream" };
      },
      download: (receivedBlob, filename) => calls.push([receivedBlob, filename]),
    });
    assert.deepEqual(calls[0], ["INC-1032", format]);
    assert.equal(calls[1][0], blob);
    assert.equal(calls[1][1], `server-report.${format}`);
  }
});

test("successful and failed exports report scoped feedback", async () => {
  const feedback = [];
  await runIncidentReportExport({
    incidentId: "INC-1032",
    format: "pdf",
    request: async () => ({ blob: new Blob(["pdf"]), filename: "report.pdf" }),
    download() {},
    onSuccess: () => feedback.push("success"),
    onError: () => feedback.push("error"),
  });
  await assert.rejects(runIncidentReportExport({
    incidentId: "INC-1032",
    format: "csv",
    request: async () => { throw new Error("backend unavailable"); },
    download() { throw new Error("download should not run"); },
    onSuccess: () => feedback.push("unexpected-success"),
    onError: () => feedback.push("error"),
  }));
  assert.deepEqual(feedback, ["success", "error"]);
});

const originalDocument = globalThis.document;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

afterEach(() => {
  globalThis.document = originalDocument;
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

test("downloadBlob clicks the file link and always revokes its object URL", () => {
  const calls = [];
  const link = { click: () => calls.push("click") };
  globalThis.document = { createElement: (tag) => { calls.push(tag); return link; } };
  URL.createObjectURL = (blob) => { calls.push(blob); return "blob:test"; };
  URL.revokeObjectURL = (url) => calls.push(["revoke", url]);
  const blob = new Blob(["report"]);

  downloadBlob(blob, "incident.pdf");

  assert.equal(link.href, "blob:test");
  assert.equal(link.download, "incident.pdf");
  assert.equal(calls.includes("click"), true);
  assert.deepEqual(calls.at(-1), ["revoke", "blob:test"]);
});
