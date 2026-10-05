import assert from "node:assert/strict";
import { test } from "node:test";
import {
  incidentReportQuery,
  incidentSlackTicketQuery,
  incidentTrendsQuery,
  reportingKeys,
  systemSummaryQuery,
} from "../src/hooks/useReporting.js";

test("reporting keys are stable for equivalent date values", () => {
  const left = reportingKeys.trends({
    from: new Date("2026-09-01T00:00:00Z"),
    to: "2026-09-21T00:00:00.000Z",
    bucket: "day",
  });
  const right = reportingKeys.trends({
    from: "2026-09-01T00:00:00.000Z",
    to: new Date("2026-09-21T00:00:00Z"),
    bucket: "day",
  });
  assert.deepEqual(left, right);
});

test("incident report query is disabled without an incident ID", () => {
  assert.equal(incidentReportQuery(undefined).enabled, false);
  assert.equal(incidentReportQuery("incident-1").enabled, true);
});

test("Slack ticket query is independently keyed and disabled without an incident ID", () => {
  assert.equal(incidentSlackTicketQuery().enabled, false);
  assert.deepEqual(
    incidentSlackTicketQuery("incident-1").key,
    ["reporting", "incident", "incident-1", "slack-ticket"],
  );
});

test("bounded reporting queries remain disabled until dates are valid", () => {
  assert.equal(incidentTrendsQuery({ bucket: "day" }).enabled, false);
  assert.equal(systemSummaryQuery({ from: "not-a-date", to: "2026-09-21T00:00:00Z" }).enabled, false);
  assert.equal(incidentTrendsQuery({
    from: "2026-09-01T00:00:00Z",
    to: "2026-09-21T00:00:00Z",
    bucket: "day",
  }).enabled, true);
});
