import { ApiError, apiGet, apiGetBlob } from "./client.js";

export const INCIDENT_TREND_BUCKETS = ["hour", "day", "week", "month"];
export const REPORT_EXPORT_FORMATS = ["json", "csv", "pdf"];

/** @param {Date | string | undefined | null} value */
export function serializeReportDate(value, field = "date") {
  if (value === undefined || value === null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new RangeError(`Invalid ${field}`);
  return date.toISOString();
}

/**
 * @param {{from?: Date|string, to?: Date|string}} range
 * @param {{required?: boolean}=} options
 */
export function serializeReportRange(range = {}, { required = false } = {}) {
  const from = serializeReportDate(range.from, "report from date");
  const to = serializeReportDate(range.to, "report to date");
  if (required && (!from || !to)) throw new RangeError("Report from and to dates are required");
  if (from && to && from > to) throw new RangeError("Report from date must not be after to date");
  return { from, to };
}

/** @returns {Promise<import("./reporting.types").IncidentTechnicalReport>} */
export const getIncidentReport = (incidentId, options) => {
  if (!incidentId) throw new TypeError("incidentId is required");
  return apiGet(`/reports/incidents/${encodeURIComponent(incidentId)}`, undefined, options);
};

/** @returns {Promise<import("./reporting.types").SlackTicketResponse>} */
export const getIncidentSlackTicket = (incidentId, options) => {
  if (!incidentId) throw new TypeError("incidentId is required");
  return apiGet(
    `/incidents/${encodeURIComponent(incidentId)}/external-tickets/slack`,
    undefined,
    options,
  );
};

/** @returns {Promise<import("./reporting.types").IncidentAnalytics>} */
export const getIncidentAnalytics = (filters = {}, options) =>
  apiGet("/analytics/incidents", serializeReportRange(filters), options);

/** @returns {Promise<import("./reporting.types").IncidentTrendResponse>} */
export const getIncidentTrends = (filters, options) => {
  const { bucket } = filters ?? {};
  if (!INCIDENT_TREND_BUCKETS.includes(bucket)) throw new RangeError("Invalid incident trend bucket");
  return apiGet(
    "/analytics/incidents/trends",
    { ...serializeReportRange(filters, { required: true }), bucket },
    options,
  );
};

/** @returns {Promise<import("./reporting.types").SystemSummaryReport>} */
export const getSystemSummary = (filters, options) =>
  apiGet("/reports/system-summary", serializeReportRange(filters, { required: true }), options);

/**
 * Fetches an attachment but deliberately does not trigger a browser download.
 * @param {string} incidentId
 * @param {import("./reporting.types").ExportFormat} format
 * @returns {Promise<import("./reporting.types").ReportExportResponse>}
 */
export async function exportIncidentReport(incidentId, format, options) {
  if (!incidentId) throw new TypeError("incidentId is required");
  if (!REPORT_EXPORT_FORMATS.includes(format)) throw new RangeError("Unsupported report export format");
  const result = await apiGetBlob(
    `/reports/incidents/${encodeURIComponent(incidentId)}/export`,
    { format },
    { ...options, accept: exportAccept(format) },
  );
  if (!matchesExportContentType(format, result.contentType)) {
    throw new ApiError(`The API returned an unexpected content type for ${format.toUpperCase()} export`, {
      status: 502,
      body: { contentType: result.contentType },
    });
  }
  return {
    ...result,
    filename: result.filename ?? `faultline-incident-${safeFilenamePart(incidentId)}.${format}`,
  };
}

function matchesExportContentType(format, contentType) {
  const type = contentType.toLowerCase().split(";", 1)[0].trim();
  if (format === "pdf") return type === "application/pdf";
  if (format === "csv") return type === "text/csv" || type === "application/csv" || type === "application/vnd.ms-excel";
  return type === "application/json" || type === "text/json" || type.endsWith("+json");
}

function exportAccept(format) {
  if (format === "pdf") return "application/pdf";
  if (format === "csv") return "text/csv";
  return "application/json";
}

function safeFilenamePart(value) {
  return String(value).replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 100) || "report";
}
