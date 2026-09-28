import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getClusterSlackChannels,
  updateClusterSlackMapping,
  getClusterSres,
  assignClusterSre,
  unassignClusterSre,
} from "../src/api/endpoints.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("cluster SRE endpoints list, assign, and unassign engineers", async () => {
  respond({ items: [] });
  await getClusterSres("prod/eu");
  assert.equal(respond.last.url, "/api/clusters/prod%2Feu/sres");
  assert.equal(respond.last.options.method, "GET");

  await assignClusterSre("production", "user/1");
  assert.equal(respond.last.url, "/api/clusters/production/sres");
  assert.equal(respond.last.options.method, "POST");
  assert.deepEqual(JSON.parse(respond.last.options.body), { userId: "user/1" });

  await unassignClusterSre("production", "user/1");
  assert.equal(respond.last.url, "/api/clusters/production/sres/user%2F1");
  assert.equal(respond.last.options.method, "DELETE");
});

function respond(body) {
  globalThis.fetch = async (url, options) => {
    respond.last = { url: String(url), options };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

test("cluster Slack channels use the encoded cluster route", async () => {
  respond({ channels: [], mapping: null });
  await getClusterSlackChannels("prod/eu");
  assert.equal(respond.last.url, "/api/clusters/prod%2Feu/slack-channels");
  assert.equal(respond.last.options.method, "GET");
});

test("cluster Slack mapping sends only the selected channel id", async () => {
  respond({ clusterId: "production", mapping: { id: "C123", name: "incidents" } });
  await updateClusterSlackMapping("production", "C123");
  assert.equal(respond.last.url, "/api/clusters/production/slack-mapping");
  assert.equal(respond.last.options.method, "PATCH");
  assert.deepEqual(JSON.parse(respond.last.options.body), { slackChannelId: "C123" });
});
