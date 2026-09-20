/**
 * One function per route exposed by faultline-backend/apps/api.
 *
 * Parameter names here mirror the backend validators exactly (note `bucket`, not
 * `bucketMs`, on the metrics endpoint) so a rename on either side fails loudly instead
 * of silently dropping a filter.
 */
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client";

/* ---------------------------------------------------------------- system */

/** Liveness. Reports the process itself, never its dependencies. */
export const getHealth = (options) => apiGet("/health", undefined, options);

/** Readiness. 503 when a critical dependency is down; degraded ones are reported. */
export const getReadiness = (options) => apiGet("/health/ready", undefined, options);

export const getSystemInfo = (options) => apiGet("/system/info", undefined, options);

/* ------------------------------------------------------------------- auth */

/**
 * Exchanges credentials for an access token.
 *
 * `auth: false` because there is no session yet; sending a stale token here would be
 * meaningless and, if it were expired, would trip the global sign-out handler mid-login.
 */
export const login = (email, password, options) =>
  apiPost("/auth/login", { email, password }, { ...options, auth: false });

export const logout = (options) => apiPost("/auth/logout", undefined, options);

/** The identity behind the current token, re-read by the API from storage. */
export const getCurrentUser = (options) => apiGet("/auth/me", undefined, options);

/* --------------------------------------------------------------- projects */

/**
 * The projects the caller may see.
 *
 * The API scopes this by assignment, so an Onsite Engineer's list is already only their
 * projects - the client does no filtering of its own and must not start to, or the two
 * would be able to disagree.
 */
export const listProjects = (options) => apiGet("/projects", undefined, options);

export const getProject = (projectId, options) =>
  apiGet(`/projects/${encodeURIComponent(projectId)}`, undefined, options);

/** Admin only; the API refuses anyone else. */
export const createProject = (project, options) =>
  apiPost("/projects", project, options);

export const updateProject = (projectId, changes, options) =>
  apiPatch(`/projects/${encodeURIComponent(projectId)}`, changes, options);

export const deleteProject = (projectId, options) =>
  apiDelete(`/projects/${encodeURIComponent(projectId)}`, options);

/* ------------------------------------------------------- user management */

export const listUsers = (options) => apiGet("/admin/users", undefined, options);

export const createUser = (user, options) => apiPost("/admin/users", user, options);

export const updateUser = (userId, changes, options) =>
  apiPatch(`/admin/users/${encodeURIComponent(userId)}`, changes, options);

/** Assignment is the single source of truth for an engineer's project access. */
export const assignProject = (userId, projectId, environments, options) =>
  apiPut(
    `/admin/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}`,
    { environments: environments ?? [] },
    options,
  );

export const unassignProject = (userId, projectId, options) =>
  apiDelete(
    `/admin/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}`,
    options,
  );

/* ---------------------------------------------------------------- audit */

export const listAuditLog = (filter = {}, options) =>
  apiGet(
    "/admin/audit",
    {
      userId: filter.userId,
      action: filter.action,
      resourceType: filter.resourceType,
      resourceId: filter.resourceId,
      outcome: filter.outcome,
      since: filter.since,
      until: filter.until,
      limit: filter.limit,
    },
    options,
  );

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
