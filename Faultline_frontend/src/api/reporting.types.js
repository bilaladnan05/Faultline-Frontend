/**
 * Reporting DTO contracts mirrored from @faultline/reporting.
 *
 * This application is JavaScript-first, so exported JSDoc typedefs are its type
 * convention. These types document the transport shape without changing it.
 */

/** @typedef {"INFO" | "WARNING" | "HIGH" | "CRITICAL"} IncidentSeverity */
/** @typedef {"OPEN" | "ACTIVE" | "RESOLVED"} IncidentStatus */
/** @typedef {"hour" | "day" | "week" | "month"} IncidentTrendBucket */
/** @typedef {"json" | "csv" | "pdf"} ExportFormat */
/** @typedef {"ok" | "degraded" | "unavailable"} ReadinessStatus */
/** @typedef {"HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN"} ServiceHealthStatus */

/**
 * @typedef {Object} IncidentReportSummary
 * @property {string} description
 * @property {string | null} suspectedCause
 * @property {string | null} rootCause
 */

/**
 * @typedef {Object} IncidentReportMetrics
 * @property {string} id
 * @property {string} title
 * @property {IncidentSeverity} severity
 * @property {IncidentStatus} status
 * @property {string} classification
 * @property {string} clusterId
 * @property {string=} namespace
 * @property {string} detectedAt
 * @property {string | null} acknowledgedAt
 * @property {string | null} resolvedAt
 * @property {number} durationMs
 * @property {readonly string[]} affectedServices
 */

/**
 * @typedef {Object} IncidentAnomalySummary
 * @property {number} total
 * @property {Readonly<Record<string, number>>} byClassification
 * @property {Readonly<Record<string, number>>} bySource
 * @property {Readonly<Record<string, number>>} bySeverity
 * @property {Readonly<Record<string, number>>} byStatus
 */

/**
 * @typedef {Object} IncidentCodeAnalysisFinding
 * @property {string} id
 * @property {IncidentSeverity} severity
 * @property {string} title
 * @property {string=} description
 * @property {string=} location
 */

/**
 * @typedef {Object} IncidentCodeAnalysisSummary
 * @property {number} totalFindings
 * @property {number} criticalFindings
 * @property {readonly IncidentCodeAnalysisFinding[]} findings
 */

/**
 * @typedef {Object} IncidentRemediationRecord
 * @property {string} id
 * @property {string} title
 * @property {string=} description
 * @property {string=} occurredAt
 */

/**
 * @typedef {Object} IncidentRemediationSummary
 * @property {readonly IncidentRemediationRecord[]} suggested
 * @property {readonly IncidentRemediationRecord[]} executed
 */

/**
 * @typedef {Object} IncidentServiceHealth
 * @property {string} service
 * @property {ServiceHealthStatus} status
 * @property {string=} observedAt
 * @property {string=} summary
 */

/**
 * @typedef {Object} IncidentHealthSummary
 * @property {readonly IncidentServiceHealth[]} services
 */

/**
 * @typedef {Object} IncidentTimelineEntry
 * @property {string} id
 * @property {string} timestamp
 * @property {"ANOMALY_OPENED" | "ANOMALY_ACTIVE" | "ANOMALY_RESOLVED"} type
 * @property {string} anomalyId
 * @property {string} classification
 * @property {"DETERMINISTIC" | "STATISTICAL" | "LOG_CLASSIFIER"} source
 * @property {IncidentSeverity} severity
 * @property {string} summary
 */

/**
 * @typedef {Object} IncidentTechnicalReport
 * @property {string} reportId
 * @property {string} generatedAt
 * @property {IncidentReportMetrics} incident
 * @property {IncidentReportSummary} summary
 * @property {IncidentAnomalySummary} anomalies
 * @property {IncidentCodeAnalysisSummary} codeAnalysis
 * @property {IncidentRemediationSummary} remediation
 * @property {IncidentHealthSummary} health
 * @property {readonly IncidentTimelineEntry[]} timeline
 */

/**
 * @typedef {Object} IncidentAnalytics
 * @property {{from: string | null, to: string | null}} range
 * @property {number} totalIncidents
 * @property {number} openIncidents
 * @property {number} resolvedIncidents
 * @property {number} criticalIncidents
 * @property {Readonly<Record<string, number>>} incidentsBySeverity
 * @property {Readonly<Record<string, number>>} incidentsByStatus
 * @property {Readonly<Record<string, number>>} incidentsByClassification
 * @property {Readonly<Record<string, number>>} incidentsByService
 * @property {number} resolutionRate
 * @property {number | null} mttrMs
 * @property {number | null} mttaMs
 */

/**
 * @typedef {Object} IncidentTrendPoint
 * @property {string} timestamp
 * @property {number} total
 * @property {number} critical
 * @property {number} resolved
 */

/**
 * @typedef {Object} IncidentTrendResponse
 * @property {IncidentTrendBucket} bucket
 * @property {readonly IncidentTrendPoint[]} points
 */

/**
 * @typedef {Object} SystemSummaryReport
 * @property {string} generatedAt
 * @property {{from: string, to: string}} period
 * @property {{available: boolean, overallStatus: ReadinessStatus, healthyServices: number, degradedServices: number, unhealthyServices: number}} health
 * @property {{total: number, critical: number, resolved: number, unresolved: number}} incidents
 * @property {{mttrMs: number | null, mttaMs: number | null}} performance
 * @property {readonly {service: string, incidentCount: number}[]} topAffectedServices
 * @property {readonly {classification: string, incidentCount: number}[]} commonIncidentCategories
 * @property {readonly IncidentTrendPoint[]} trends
 */

/**
 * @typedef {Object} ReportExportResponse
 * @property {Blob} blob
 * @property {string} contentType
 * @property {string} filename
 */

/**
 * Safe read-only projection of a persisted Slack incident ticket.
 * @typedef {Object} SlackTicket
 * @property {"slack"} provider
 * @property {"LINKED"} status
 * @property {string} channelId
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string=} url
 */

/**
 * @typedef {Object} SlackTicketResponse
 * @property {SlackTicket | null} ticket
 */

export {};
