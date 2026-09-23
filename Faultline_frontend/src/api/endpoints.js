/**
 * One function per route exposed by faultline-backend/apps/api.
 *
 * Parameter names here mirror the backend validators exactly (note `bucket`, not
 * `bucketMs`, on the metrics endpoint) so a rename on either side fails loudly instead
 * of silently dropping a filter.
 */
import { apiGet } from "./client";

// Reporting remains in its own contract-focused module, but is re-exported here so
// consumers keep using the app's established one-stop endpoint surface.
export {
  exportIncidentReport,
  getIncidentAnalytics,
  getIncidentReport,
  getIncidentSlackTicket,
  getIncidentTrends,
  getSystemSummary,
  INCIDENT_TREND_BUCKETS,
  REPORT_EXPORT_FORMATS,
} from "./reporting.js";

/* ---------------------------------------------------------------- system */

/** Liveness. Reports the process itself, never its dependencies. */
export const getHealth = (options) => apiGet("/health", undefined, options);

/** Readiness. 503 when a critical dependency is down; degraded ones are reported. */
export const getReadiness = (options) => apiGet("/health/ready", undefined, options);

export const getSystemInfo = (options) => apiGet("/system/info", undefined, options);

/** Clusters explicitly registered by the onboarding process. */
export const listClusters = (options) => apiGet("/clusters", undefined, options);

/* ------------------------------------------------------------- incidents */

/**
 * @param {{cluster?: string, namespace?: string, status?: string,
 *          severity?: string, classification?: string}} filter
 */
export const listIncidents = (filter = {}, options) =>
  apiGet(
    "/incidents",
    {
      cluster: filter.cluster,
      namespace: filter.namespace,
      status: filter.status,
      severity: filter.severity,
      classification: filter.classification,
    },
    options,
  );

export const getIncident = (id, options) =>
  apiGet(`/incidents/${encodeURIComponent(id)}`, undefined, options);

/**
 * The incident's evidence window: stored anomaly evidence plus the telemetry
 * (error logs, warning events, metric samples) from the window it occupied.
 */
export const getIncidentEvidence = (id, { leadMs, trailMs, limit } = {}, options) =>
  apiGet(
    `/incidents/${encodeURIComponent(id)}/evidence`,
    { leadMs, trailMs, limit },
    options,
  );

/* ------------------------------------------------------------- telemetry */

/** `startTime`/`endTime` are mandatory: the API refuses an unbounded window. */
export const searchLogs = (query, options) =>
  apiGet(
    "/telemetry/logs",
    {
      clusterId: query.clusterId,
      namespace: query.namespace,
      workload: query.workload,
      pod: query.pod,
      container: query.container,
      node: query.node,
      severity: query.severity,
      search: query.search,
      traceId: query.traceId,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
      cursor: query.cursor,
    },
    options,
  );

export const queryMetrics = (query, options) =>
  apiGet(
    "/telemetry/metrics",
    {
      clusterId: query.clusterId,
      metricName: query.metricName,
      namespace: query.namespace,
      workload: query.workload,
      pod: query.pod,
      container: query.container,
      node: query.node,
      startTime: query.startTime,
      endTime: query.endTime,
      bucket: query.bucketMs,
      aggregations: query.aggregations,
      limit: query.limit,
    },
    options,
  );

export const searchKubernetesEvents = (query, options) =>
  apiGet(
    "/telemetry/kubernetes-events",
    {
      clusterId: query.clusterId,
      namespace: query.namespace,
      workload: query.workload,
      pod: query.pod,
      node: query.node,
      reason: query.reason,
      type: query.type,
      resourceName: query.resourceName,
      resourceKind: query.resourceKind,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
      cursor: query.cursor,
    },
    options,
  );

/**
 * Everything retained about one resource in a window.
 * `resourceId` is `<scope>:<cluster>:<namespace>:<name>[:<container>]`, already
 * percent-encoded per segment by the backend's encoder — so it is passed through whole.
 */
export const getResourceTimeline = (resourceId, query, options) =>
  apiGet(
    `/resources/${resourceId}/timeline`,
    {
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
      severity: query.severity,
      metricNames: query.metricNames,
    },
    options,
  );

/* ------------------------------------------------------------- baselines */

export const listBaselines = (filter = {}, options) =>
  apiGet(
    "/baselines",
    {
      clusterId: filter.clusterId,
      namespace: filter.namespace,
      workload: filter.workload,
      metricName: filter.metricName,
      window: filter.window,
      status: filter.status,
      limit: filter.limit,
    },
    options,
  );

export const getBaseline = (resourceId, metricName, { window } = {}, options) =>
  apiGet(
    `/baselines/${resourceId}/${encodeURIComponent(metricName)}`,
    { window },
    options,
  );

/** Windows and severities the API accepts, for building filter controls. */
export const BASELINE_WINDOWS = ["1h", "6h", "24h", "7d"];
export const LOG_SEVERITIES = ["trace", "debug", "info", "warn", "error", "fatal", "unknown"];
export const ERROR_SEVERITIES = ["error", "fatal"];
export const INCIDENT_STATUSES = ["OPEN", "ACTIVE", "RESOLVED"];
export const INCIDENT_SEVERITIES = ["INFO", "WARNING", "HIGH", "CRITICAL"];
export const INCIDENT_CLASSIFICATIONS = [
  "MEMORY_EXHAUSTION",
  "RESOURCE_SATURATION",
  "WORKLOAD_CRASHING",
  "DEPLOYMENT_DEGRADATION",
  "NODE_FAILURE",
  "WORKLOAD_CONFIGURATION_FAILURE",
  "SCHEDULING_FAILURE",
  "APPLICATION_DEGRADATION",
  "APPLICATION_DEPENDENCY_FAILURE",
];
export const TIMELINE_METRIC_NAMES = [
  "k8s.container.memory.usage",
  "k8s.container.memory.limit",
  "k8s.container.cpu.usage",
  "k8s.container.restart_count",
];
