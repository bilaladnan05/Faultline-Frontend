/**
 * Backend domain objects -> the shapes the existing UI components render.
 *
 * The API speaks Kubernetes: incidents carry a classification, a primary resource and
 * anomaly evidence, not a "service" and an "assignee". These adapters do the translation
 * in one place so pages stay presentational, and they deliberately never invent values
 * the backend does not have — a field with no source resolves to null and the component
 * shows a dash rather than a plausible-looking fake.
 */
import { TIMELINE_METRIC_NAMES } from "./endpoints";

/* -------------------------------------------------------------- labelling */

const CLASSIFICATION_LABELS = {
  // Anomaly classifications: deterministic, statistical, then log-classifier findings.
  // Spelled out because title-casing turns OOM_KILLED into the unreadable "Oom Killed".
  OOM_KILLED: "OOM Killed",
  CRASH_LOOP: "Crash Loop",
  HIGH_MEMORY_UTILIZATION: "High Memory Utilization",
  HIGH_CPU_UTILIZATION: "High CPU Utilization",
  POD_NOT_READY: "Pod Not Ready",
  DEPLOYMENT_DEGRADED: "Deployment Degraded",
  FAILED_SCHEDULING: "Failed Scheduling",
  IMAGE_PULL_FAILURE: "Image Pull Failure",
  FAILED_MOUNT: "Failed Mount",
  NODE_NOT_READY: "Node Not Ready",
  CPU_USAGE_ANOMALY: "CPU Usage Anomaly",
  MEMORY_USAGE_ANOMALY: "Memory Usage Anomaly",
  MEMORY_GROWTH_ANOMALY: "Memory Growth Anomaly",
  ERROR_RATE_ANOMALY: "Error Rate Anomaly",
  RESTART_RATE_ANOMALY: "Restart Rate Anomaly",
  NETWORK_RX_ANOMALY: "Network RX Anomaly",
  NETWORK_TX_ANOMALY: "Network TX Anomaly",
  LATENCY_ANOMALY: "Latency Anomaly",
  APPLICATION_EXCEPTION: "Application Exception",
  DATABASE_CONNECTIVITY: "Database Connectivity",
  DEPENDENCY_TIMEOUT: "Dependency Timeout",
  AUTHENTICATION_FAILURE: "Authentication Failure",
  AUTHORIZATION_FAILURE: "Authorization Failure",
  CONFIGURATION_ERROR: "Configuration Error",
  NETWORK_FAILURE: "Network Failure",
  RATE_LIMITING: "Rate Limiting",
  RESOURCE_EXHAUSTION: "Resource Exhaustion",
  STORAGE_FAILURE: "Storage Failure",
  STARTUP_FAILURE: "Startup Failure",

  // Incident classifications.
  MEMORY_EXHAUSTION: "Memory Exhaustion",
  RESOURCE_SATURATION: "Resource Saturation",
  WORKLOAD_CRASHING: "Workload Crashing",
  DEPLOYMENT_DEGRADATION: "Deployment Degradation",
  NODE_FAILURE: "Node Failure",
  WORKLOAD_CONFIGURATION_FAILURE: "Workload Configuration Failure",
  SCHEDULING_FAILURE: "Scheduling Failure",
  APPLICATION_DEGRADATION: "Application Degradation",
  APPLICATION_DEPENDENCY_FAILURE: "Application Dependency Failure",
};

const SOURCE_LABELS = {
  DETERMINISTIC: "Kubernetes-reported",
  STATISTICAL: "Baseline deviation",
  LOG_CLASSIFIER: "Log classification",
};

export const classificationLabel = (value) =>
  CLASSIFICATION_LABELS[value] ?? titleCase(value);

export const sourceLabel = (value) => SOURCE_LABELS[value] ?? titleCase(value);

export function titleCase(value) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** OPEN | ACTIVE | RESOLVED -> the capitalised form StatusPill styles. */
export const statusLabel = (status) => titleCase(status);

/* ------------------------------------------------------------ formatting */

export function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function formatClockTime(value) {
  if (!value) return "--:--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], { hour12: false });
}

/** Elapsed time as HH:MM:SS — the format the incident header already renders. */
export function formatDuration(fromIso, toIso) {
  const from = Date.parse(fromIso);
  const to = toIso ? Date.parse(toIso) : Date.now();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return "—";
  const totalSeconds = Math.floor((to - from) / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/** A duration already in milliseconds, as HH:MM:SS. */
export function formatMillis(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/** Formats a backend-provided ratio without deriving the ratio in the browser. */
export function formatPercentage(value, fractionDigits = 1) {
  if (!Number.isFinite(value)) return "N/A";
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/** Compact "14 min" / "2h 10m" for table columns. */
export function formatAge(fromIso, toIso) {
  const from = Date.parse(fromIso);
  const to = toIso ? Date.parse(toIso) : Date.now();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return "—";
  const minutes = Math.floor((to - from) / 60000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function formatMetricValue(value, unit) {
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  if (unit === "By" || unit === "bytes") return formatBytes(value);
  if (unit === "s") return `${value.toFixed(2)}s`;
  if (unit === "ms") return `${Math.round(value)}ms`;
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(2));
  return unit ? `${rounded} ${unit}` : String(rounded);
}

function formatBytes(bytes) {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let index = 0;
  while (Math.abs(value) >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
}

/** The API scores confidence 0–1; the UI shows whole percent. */
export const confidencePercent = (confidence) =>
  Number.isFinite(confidence) ? Math.round(confidence * 100) : 0;

/* ------------------------------------------------------------- resources */

/** A readable name for an AnomalyAffectedResource, most specific part first. */
export function resourceLabel(resource) {
  if (!resource) return "unknown";
  switch (resource.scope) {
    case "container":
      return resource.container ? `${resource.pod}/${resource.container}` : resource.pod ?? "container";
    case "pod":
      return resource.pod ?? "pod";
    case "deployment":
      return resource.workload ?? "workload";
    case "node":
      return resource.node ?? "node";
    default:
      return resource.workload ?? resource.pod ?? resource.node ?? "resource";
  }
}

/**
 * Encodes an AnomalyAffectedResource as the telemetry resource id the
 * `/resources/:id/timeline` and `/baselines/:id/:metric` routes expect.
 * Mirrors `encodeTelemetryResourceId` in @faultline/telemetry.
 */
export function encodeResourceId(resource) {
  const ref = toResourceRef(resource);
  if (!ref) return null;
  const segments = [
    ref.scope,
    ref.clusterId,
    ref.namespace ?? "",
    ref.name,
    ...(ref.scope === "container" && ref.container ? [ref.container] : []),
  ];
  return segments.map(encodeURIComponent).join(":");
}

/** Mirrors the backend's `toResourceRef`, including its "incomplete means skip" rule. */
export function toResourceRef(resource) {
  if (!resource) return null;
  switch (resource.scope) {
    case "container":
      return resource.namespace && resource.pod && resource.container
        ? {
            scope: "container",
            clusterId: resource.clusterId,
            namespace: resource.namespace,
            name: resource.pod,
            container: resource.container,
          }
        : null;
    case "pod":
      return resource.namespace && resource.pod
        ? { scope: "pod", clusterId: resource.clusterId, namespace: resource.namespace, name: resource.pod }
        : null;
    case "deployment":
      return resource.workload
        ? {
            scope: "workload",
            clusterId: resource.clusterId,
            ...(resource.namespace ? { namespace: resource.namespace } : {}),
            name: resource.workload,
          }
        : null;
    case "node":
      return resource.node
        ? { scope: "node", clusterId: resource.clusterId, name: resource.node }
        : null;
    default:
      return null;
  }
}

/* ------------------------------------------------------------- incidents */

/** Severity ranking, used wherever "worst first" matters. */
const SEVERITY_RANK = { CRITICAL: 4, HIGH: 3, WARNING: 2, INFO: 1 };
export const severityRank = (severity) => SEVERITY_RANK[severity] ?? 0;

/**
 * Incident -> the row/detail shape the incident pages render.
 *
 * `service` is the primary resource's workload because that is the closest thing the
 * backend has to the mock's "impacted service"; `impact` counts the affected resources,
 * which is the only impact figure the API actually measures.
 */
export function adaptIncident(incident) {
  if (!incident) return null;
  const primary = incident.primaryResource;
  const resources = dedupeResources([primary, ...(incident.affectedResources ?? [])]);

  return {
    id: incident.id,
    title: incident.title,
    description: incident.summary,
    summary: incident.summary,
    severity: incident.severity,
    status: statusLabel(incident.status),
    rawStatus: incident.status,
    classification: incident.classification,
    classificationLabel: classificationLabel(incident.classification),
    clusterId: incident.clusterId,
    namespace: incident.namespace ?? null,
    service: resourceLabel(primary),
    region: incident.clusterId,
    cluster: incident.clusterId,
    confidence: confidencePercent(incident.confidence),
    createdAt: incident.firstSeen,
    firstSeen: incident.firstSeen,
    lastSeen: incident.lastSeen,
    resolvedAt: incident.resolvedAt ?? null,
    stabilizationStartedAt: incident.stabilizationStartedAt ?? null,
    elapsedTime: formatDuration(incident.firstSeen, incident.resolvedAt ?? incident.lastSeen),
    age: formatAge(incident.firstSeen, incident.resolvedAt ?? null),
    impact: impactSummary(resources),
    correlationKey: incident.correlationKey,
    primaryResource: primary ?? null,
    primaryResourceId: encodeResourceId(primary),
    affectedAssets: resources.map((resource) => ({
      name: resourceLabel(resource),
      scope: resource.scope,
      namespace: resource.namespace ?? null,
      resourceId: encodeResourceId(resource),
      severity: incident.severity,
    })),
    anomalies: incident.anomalies ?? [],
    evidence: incident.evidence ?? [],
    timeline: incident.timeline ?? [],
    /** Progress stepper derived from real incident state, not a scripted demo path. */
    progress: progressSteps(incident),
  };
}

function impactSummary(resources) {
  if (!resources.length) return "No resources recorded";
  const counts = resources.reduce((acc, resource) => {
    acc[resource.scope] = (acc[resource.scope] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([scope, count]) => `${count} ${scope}${count === 1 ? "" : "s"}`)
    .join(" · ");
}

function dedupeResources(resources) {
  const seen = new Set();
  return resources.filter((resource) => {
    if (!resource) return false;
    const key = JSON.stringify([
      resource.scope,
      resource.clusterId,
      resource.namespace,
      resource.workload,
      resource.pod,
      resource.container,
      resource.node,
    ]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * The lifecycle the backend actually models: an incident is detected (OPEN), confirmed
 * by further anomalies (ACTIVE), may enter stabilization, and is closed (RESOLVED).
 */
function progressSteps(incident) {
  const hasEvidence = (incident.evidence?.length ?? 0) > 0;
  const resolved = incident.status === "RESOLVED";
  const stabilizing = Boolean(incident.stabilizationStartedAt);
  return [
    { label: "DETECTED", done: true, at: incident.firstSeen },
    {
      label: "CORRELATED",
      done: incident.status !== "OPEN" || (incident.anomalies?.length ?? 0) > 1,
      at: null,
    },
    { label: "EVIDENCE", done: hasEvidence, at: null },
    { label: "STABILIZING", done: stabilizing || resolved, at: incident.stabilizationStartedAt ?? null },
    { label: "RESOLVED", done: resolved, at: incident.resolvedAt ?? null },
  ];
}

/* ------------------------------------------------------------------ logs */

const SEVERITY_TO_LEVEL = {
  trace: "DEBUG",
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  fatal: "ERROR",
  unknown: "INFO",
};

/** StoredLogRecord -> the terminal-line shape the log views render. */
export function adaptLogRecord(record) {
  return {
    id: record.eventId,
    ts: formatClockTime(record.eventTimestamp),
    timestamp: record.eventTimestamp,
    level: SEVERITY_TO_LEVEL[record.severity] ?? "INFO",
    severity: record.severity,
    source:
      record.container ??
      record.pod ??
      record.workload ??
      record.service ??
      record.node ??
      record.namespace ??
      "—",
    msg: record.message,
    truncated: record.messageTruncated,
    traceId: record.traceId ?? null,
    namespace: record.namespace ?? null,
    highlight: record.severity === "error" || record.severity === "fatal",
  };
}

/** StoredKubernetesEventRecord -> a uniform row for the events panel. */
export function adaptKubernetesEvent(record) {
  return {
    id: record.eventId,
    ts: formatClockTime(record.eventTimestamp),
    timestamp: record.eventTimestamp,
    reason: record.reason,
    type: record.type,
    message: record.message,
    resource: `${record.resourceKind}/${record.resourceName}`,
    namespace: record.namespace ?? null,
    count: record.count,
  };
}

/* --------------------------------------------------------------- metrics */

const METRIC_LABELS = {
  "k8s.container.memory.usage": "Memory usage",
  "k8s.container.memory.limit": "Memory limit",
  "k8s.container.cpu.usage": "CPU usage",
  "k8s.container.restart_count": "Restarts",
};

export const metricLabel = (name) => METRIC_LABELS[name] ?? name;

/**
 * MetricBucket[] -> Recharts rows.
 *
 * Buckets arrive one row per series per bucket; the chart needs one row per bucket with
 * a column per series, so they are pivoted on `bucketStart`.
 */
export function bucketsToSeries(buckets = [], { aggregation = "avg" } = {}) {
  const rows = new Map();
  const seriesNames = new Set();

  for (const bucket of buckets) {
    const value = bucket[aggregation];
    if (value === undefined || value === null) continue;
    const name = seriesName(bucket);
    seriesNames.add(name);
    const key = bucket.bucketStart;
    const row = rows.get(key) ?? { bucketStart: key, label: formatClockTime(key) };
    row[name] = value;
    rows.set(key, row);
  }

  return {
    data: [...rows.values()].sort(
      (a, b) => Date.parse(a.bucketStart) - Date.parse(b.bucketStart),
    ),
    series: [...seriesNames],
    unit: buckets.find((bucket) => bucket.unit)?.unit ?? null,
  };
}

/**
 * Collapses per-identity buckets into one row per bucket.
 *
 * The metrics endpoint groups by full resource identity, so a cluster-wide query returns
 * one series per container — unreadable on an overview chart. This folds them into the
 * cluster's average and peak for each bucket, which is what the overview actually claims
 * to show, and reports how many series were folded so the chart can say so.
 */
export function aggregateBucketsAcrossSeries(buckets = []) {
  const rows = new Map();
  const seriesNames = new Set();

  for (const bucket of buckets) {
    seriesNames.add(seriesName(bucket));
    const row = rows.get(bucket.bucketStart) ?? {
      bucketStart: bucket.bucketStart,
      label: formatClockTime(bucket.bucketStart),
      sum: 0,
      samples: 0,
      peak: null,
    };
    if (Number.isFinite(bucket.avg)) {
      row.sum += bucket.avg;
      row.samples += 1;
    }
    const peak = Number.isFinite(bucket.max) ? bucket.max : bucket.avg;
    if (Number.isFinite(peak)) row.peak = row.peak === null ? peak : Math.max(row.peak, peak);
    rows.set(bucket.bucketStart, row);
  }

  const data = [...rows.values()]
    .sort((a, b) => Date.parse(a.bucketStart) - Date.parse(b.bucketStart))
    .map((row) => ({
      bucketStart: row.bucketStart,
      label: row.label,
      average: row.samples ? row.sum / row.samples : null,
      peak: row.peak,
    }));

  return {
    data,
    seriesCount: seriesNames.size,
    unit: buckets.find((bucket) => bucket.unit)?.unit ?? null,
  };
}

function seriesName(bucket) {
  return (
    bucket.container ??
    bucket.pod ??
    bucket.workload ??
    bucket.node ??
    bucket.namespace ??
    bucket.clusterId
  );
}

/** Groups a timeline's metric samples by metric name, newest sample last. */
export function groupMetricSamples(samples = []) {
  const groups = new Map();
  for (const sample of samples) {
    const list = groups.get(sample.metricName) ?? [];
    list.push(sample);
    groups.set(sample.metricName, list);
  }
  return [...groups.entries()]
    .sort((a, b) => TIMELINE_METRIC_NAMES.indexOf(a[0]) - TIMELINE_METRIC_NAMES.indexOf(b[0]))
    .map(([metricName, list]) => {
      const sorted = [...list].sort(
        (a, b) => Date.parse(a.eventTimestamp) - Date.parse(b.eventTimestamp),
      );
      const latest = sorted[sorted.length - 1];
      return {
        metricName,
        label: metricLabel(metricName),
        unit: latest?.unit ?? null,
        latest: latest?.value ?? null,
        latestAt: latest?.eventTimestamp ?? null,
        samples: sorted,
        points: sorted.map((sample) => ({
          label: formatClockTime(sample.eventTimestamp),
          value: sample.value,
        })),
      };
    });
}

/* ------------------------------------------------------------- baselines */

/**
 * A baseline row is only meaningful once its status is READY; BASELINE_NOT_READY rows
 * are kept and surfaced because "we said nothing because we do not know normal yet" is
 * the answer to the second most common operator question.
 */
export function adaptBaseline(baseline) {
  return {
    ...baseline,
    ready: baseline.status === "READY",
    label: baseline.label ?? metricLabel(baseline.metricName),
    display: {
      mean: formatMetricValue(baseline.mean, baseline.unit),
      p50: formatMetricValue(baseline.p50, baseline.unit),
      p95: formatMetricValue(baseline.p95, baseline.unit),
      p99: formatMetricValue(baseline.p99, baseline.unit),
      updatedAt: formatTimestamp(baseline.updatedAt),
    },
  };
}

/* -------------------------------------------------------------- clusters */

/**
 * The API exposes no cluster directory, so the workspace list is derived from the
 * clusters that incidents actually reference, and enriched with their incident counts.
 * A cluster with no incidents cannot appear here — the Deployments page lets one be
 * added by ID for exactly that case.
 */
export function clustersFromIncidents(incidents = []) {
  const clusters = new Map();
  for (const incident of incidents) {
    const entry = clusters.get(incident.clusterId) ?? {
      id: incident.clusterId,
      clusterId: incident.clusterId,
      name: incident.clusterId,
      env: "CLUSTER",
      region: incident.clusterId,
      namespaces: new Set(),
      total: 0,
      open: 0,
      critical: 0,
      lastSeen: null,
    };
    entry.total += 1;
    if (incident.status !== "RESOLVED") entry.open += 1;
    if (incident.severity === "CRITICAL") entry.critical += 1;
    if (incident.namespace) entry.namespaces.add(incident.namespace);
    if (!entry.lastSeen || Date.parse(incident.lastSeen) > Date.parse(entry.lastSeen)) {
      entry.lastSeen = incident.lastSeen;
    }
    clusters.set(incident.clusterId, entry);
  }

  return [...clusters.values()]
    .map((entry) => ({
      ...entry,
      namespaces: [...entry.namespaces].sort(),
      status: entry.open > 0 ? "degraded" : "connected",
    }))
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
}
