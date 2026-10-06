import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the admin audit page uses the authenticated backend audit endpoint", () => {
  const endpoints = read("src/api/endpoints.js");
  const page = read("src/pages/admin/AdminAuditPage.jsx");

  assert.match(endpoints, /export const listAuditLog/);
  assert.match(endpoints, /apiGet\(\s*"\/admin\/audit"/);
  assert.doesNotMatch(endpoints, /organizationId:\s*filter\.organizationId/);
  assert.match(page, /listAuditLog\(queryFilters\(filters\), \{ signal \}\)/);
  assert.match(page, /audit\.data\?\.items/);
  assert.doesNotMatch(page, /apiDelete|apiPatch|apiPost|apiPut/);
});

test("audit filters are server-backed and records have a read-only detail dialog", () => {
  const endpoints = read("src/api/endpoints.js");
  const page = read("src/pages/admin/AdminAuditPage.jsx");

  for (const filter of [
    "userId",
    "action",
    "resourceType",
    "resourceId",
    "outcome",
    "since",
    "until",
    "limit",
  ]) {
    assert.match(endpoints, new RegExp(`${filter}: filter\\.${filter}`));
  }
  assert.match(page, /Apply filters/);
  assert.match(page, /type="datetime-local"/);
  assert.match(page, /setSelected\(entry\)/);
  assert.match(page, /function AuditDetailDialog/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /entry\.userAgent/);
  assert.match(page, /JSON\.stringify\(entry\.metadata \?\? \{\}, null, 2\)/);
  assert.doesNotMatch(page, /Save|Delete record|Edit record/);
});
