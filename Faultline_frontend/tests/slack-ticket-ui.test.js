import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

let server;
let SlackTicketStatus;

before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "error",
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
  });
  ({ default: SlackTicketStatus } = await server.ssrLoadModule(
    "/src/components/incidents/SlackTicketStatus.jsx",
  ));
});

after(async () => {
  await server?.close();
});

function render(query) {
  return renderToStaticMarkup(React.createElement(SlackTicketStatus, { query }));
}

test("Slack ticket visibility shows safe status, channel, and external link", () => {
  const html = render({
    loading: false,
    error: null,
    data: {
      ticket: {
        provider: "slack",
        status: "LINKED",
        channelId: "C123",
        createdAt: "2026-09-21T10:02:00.000Z",
        updatedAt: "2026-09-21T10:03:00.000Z",
        url: "https://slack.com/archives/C123/p123",
      },
    },
    refetch() {},
  });
  assert.match(html, /Slack Ticket/);
  assert.match(html, /Linked/);
  assert.match(html, /C123/);
  assert.match(html, /Open in Slack/);
  assert.match(html, /rel="noreferrer"/);
});

test("Slack ticket visibility has an explicit empty state", () => {
  const html = render({
    loading: false,
    error: null,
    data: { ticket: null },
    refetch() {},
  });
  assert.match(html, /No Slack ticket is linked/);
  assert.doesNotMatch(html, /Open in Slack/);
});

test("Slack ticket lookup failure remains scoped and retryable", () => {
  const html = render({
    loading: false,
    error: new Error("unavailable"),
    data: null,
    refetch() {},
  });
  assert.match(html, /status is unavailable/);
  assert.match(html, /Retry/);
});
