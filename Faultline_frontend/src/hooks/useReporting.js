import { useApiResource } from "./useApiResource.js";
import {
  getIncidentAnalytics,
  getIncidentReport,
  getIncidentSlackTicket,
  getIncidentTrends,
  getSystemSummary,
  INCIDENT_TREND_BUCKETS,
  serializeReportRange,
} from "../api/reporting.js";

function dateKey(value) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : String(value);
}

function rangeIsValid(filters = {}, required = false) {
  try {
    serializeReportRange(filters, { required });
    return true;
  } catch {
    return false;
  }
}

/** Stable scalar keys double as useApiResource dependency arrays. */
export const reportingKeys = {
  incident: (incidentId) => ["reporting", "incident", incidentId ?? null],
  slackTicket: (incidentId) => ["reporting", "incident", incidentId ?? null, "slack-ticket"],
  analytics: (filters = {}) => ["analytics", "incidents", dateKey(filters.from), dateKey(filters.to)],
  trends: (filters = {}) => [
    "analytics",
    "incident-trends",
    dateKey(filters.from),
    dateKey(filters.to),
    filters.bucket ?? null,
  ],
  systemSummary: (filters = {}) => ["reporting", "system-summary", dateKey(filters.from), dateKey(filters.to)],
};

/** Query descriptors are exported so enablement and keys remain testable without a hook renderer. */
export const incidentReportQuery = (incidentId) => ({
  key: reportingKeys.incident(incidentId),
  enabled: Boolean(incidentId),
  fetcher: ({ signal }) => getIncidentReport(incidentId, { signal }),
});

export const incidentSlackTicketQuery = (incidentId) => ({
  key: reportingKeys.slackTicket(incidentId),
  enabled: Boolean(incidentId),
  fetcher: ({ signal }) => getIncidentSlackTicket(incidentId, { signal }),
});

export const incidentAnalyticsQuery = (filters = {}) => ({
  key: reportingKeys.analytics(filters),
  enabled: rangeIsValid(filters),
  fetcher: ({ signal }) => getIncidentAnalytics(filters, { signal }),
});

export const incidentTrendsQuery = (filters = {}) => ({
  key: reportingKeys.trends(filters),
  enabled: rangeIsValid(filters, true) && INCIDENT_TREND_BUCKETS.includes(filters.bucket),
  fetcher: ({ signal }) => getIncidentTrends(filters, { signal }),
});

export const systemSummaryQuery = (filters = {}) => ({
  key: reportingKeys.systemSummary(filters),
  enabled: rangeIsValid(filters, true),
  fetcher: ({ signal }) => getSystemSummary(filters, { signal }),
});

export function useIncidentReport(incidentId) {
  const query = incidentReportQuery(incidentId);
  return useApiResource(query.fetcher, query.key, { enabled: query.enabled });
}

export function useIncidentSlackTicket(incidentId) {
  const query = incidentSlackTicketQuery(incidentId);
  return useApiResource(query.fetcher, query.key, { enabled: query.enabled });
}

export function useIncidentAnalytics(filters = {}) {
  const query = incidentAnalyticsQuery(filters);
  return useApiResource(query.fetcher, query.key, { enabled: query.enabled });
}

export function useIncidentTrends(filters = {}) {
  const query = incidentTrendsQuery(filters);
  return useApiResource(query.fetcher, query.key, { enabled: query.enabled });
}

export function useSystemSummary(filters = {}) {
  const query = systemSummaryQuery(filters);
  return useApiResource(query.fetcher, query.key, { enabled: query.enabled });
}
