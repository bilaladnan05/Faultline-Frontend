import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(import.meta.dirname, "../src/pages/IntegrationsPage.jsx"),
  "utf8",
);

test("saving Slack configuration refreshes cluster channel choices", () => {
  assert.match(source, /const \[slackRevision, setSlackRevision\] = useState\(0\)/);
  assert.match(source, /<SlackIntegrationCard onChanged=/);
  assert.match(source, /<ClusterCommunicationsCard slackRevision=\{slackRevision\}/);
  assert.match(source, /\[activeId, slackRevision\]/);
  assert.match(source, /await resource\.refetch\(\); onChanged\?\.\(\)/);
  assert.match(source, /onClick=\{channelResource\.refetch\}/);
});

test("integrations page focuses on Slack configuration and shows cluster routing", () => {
  assert.doesNotMatch(source, /Enabled components/);
  assert.doesNotMatch(source, /Dependency readiness/);
  assert.doesNotMatch(source, /getSystemInfo|getReadiness/);
  assert.match(source, /Current cluster routing/);
  assert.match(source, /cluster\.slackChannelName \|\| cluster\.slackChannelId/);
  assert.match(source, /Organization default/);
  assert.match(source, /Cluster-specific/);
});
