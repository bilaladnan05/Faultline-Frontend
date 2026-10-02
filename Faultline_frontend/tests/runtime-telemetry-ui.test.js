import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";
import {
  applicationOptions,
  matchesRuntimeSearch,
  splitRuntimeTelemetry,
} from "../src/components/runtime/runtimeTelemetry.js";

let server;
let RuntimeMetricChart;
let TelemetryLogSection;

before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "error",
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
  });
  ({ default: RuntimeMetricChart } = await server.ssrLoadModule("/src/components/runtime/RuntimeMetricChart.jsx"));
  ({ default: TelemetryLogSection } = await server.ssrLoadModule("/src/components/runtime/TelemetryLogSection.jsx"));
});

after(async () => server?.close());

const appLog = {
  id: "app-1",
  timestamp: "2026-10-01T10:00:00.000Z",
  ts: "10:00:00",
  level: "INFO",
  namespace: "booknest",
  workload: "booknest-api",
  source: "api",
  msg: "request complete",
};
const secondAppLog = {
  ...appLog,
  id: "worker-1",
  workload: "booknest-worker",
  source: "worker",
};
const systemLog = {
  ...appLog,
  id: "dns-1",
  namespace: "kube-system",
  workload: "coredns",
  source: "coredns",
};

test("runtime telemetry keeps other applications out of the Kubernetes environment", () => {
  const options = applicationOptions([appLog, appLog, secondAppLog, systemLog]);
  assert.deepEqual(options, [
    { value: "booknest-api", count: 2 },
    { value: "booknest-worker", count: 1 },
  ]);

  const split = splitRuntimeTelemetry([appLog, secondAppLog, systemLog], "booknest-api");
  assert.deepEqual(split.applicationLogs.map((item) => item.id), ["app-1"]);
  assert.deepEqual(split.environmentLogs.map((item) => item.id), ["dns-1"]);
});

test("all applications combines frontend and backend workloads without system logs", () => {
  const split = splitRuntimeTelemetry([appLog, secondAppLog, systemLog], "");
  assert.deepEqual(split.applicationLogs.map((item) => item.id), ["app-1", "worker-1"]);
  assert.deepEqual(split.environmentLogs.map((item) => item.id), ["dns-1"]);
});

test("runtime search covers identity and message fields", () => {
  assert.equal(matchesRuntimeSearch(appLog, "booknest-api"), true);
  assert.equal(matchesRuntimeSearch(appLog, "request complete"), true);
  assert.equal(matchesRuntimeSearch(appLog, "coredns"), false);
});

test("metric chart exposes only metrics that contain samples", () => {
  const query = {
    data: [
      {
        metricName: "k8s.container.memory.usage",
        items: [
          {
            bucketStart: "2026-10-01T10:00:00.000Z",
            clusterId: "booknest",
            container: "api",
            unit: "By",
            avg: 1048576,
            max: 2097152,
          },
        ],
      },
      { metricName: "k8s.container.cpu.usage", items: [] },
    ],
    loading: false,
    error: null,
    refetch() {},
  };
  const html = renderToStaticMarkup(React.createElement(RuntimeMetricChart, { query }));
  assert.match(html, /Runtime metrics/);
  assert.match(html, /Memory usage/);
  assert.doesNotMatch(html, /CPU usage/);
});

test("environment section renders Kubernetes events distinctly from logs", () => {
  const items = [
    {
      id: "event-1",
      entryType: "event",
      ts: "10:01:00",
      timestamp: "2026-10-01T10:01:00.000Z",
      type: "Warning",
      resource: "Pod/booknest-api-1",
      reason: "BackOff",
      message: "Back-off restarting failed container",
    },
  ];
  const query = { data: items, loading: false, error: null, refetch() {} };
  const html = renderToStaticMarkup(
    React.createElement(TelemetryLogSection, {
      kind: "environment",
      title: "Kubernetes environment logs",
      description: "System activity",
      items,
      query,
      paused: false,
    }),
  );
  assert.match(html, /Kubernetes environment logs/);
  assert.match(html, /EVENT/);
  assert.match(html, /BackOff/);
});
