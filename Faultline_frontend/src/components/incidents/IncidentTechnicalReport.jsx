import { AlertTriangle, Code2, HeartPulse, RefreshCw, ShieldAlert, Wrench } from "lucide-react";
import StatusPill from "../ui/StatusPill";
import { EmptyState } from "../ui/AsyncState";
import IncidentReportExport from "./IncidentReportExport";
import { classificationLabel, formatMillis, formatTimestamp, titleCase } from "../../api/adapters";

/** Read-only presentation of the normalized IncidentTechnicalReport response. */
export default function IncidentTechnicalReport({ query, incidentId }) {
  if (query.loading && !query.data) return <ReportSkeleton />;
  if (query.error && !query.data) return <ReportError onRetry={query.refetch} />;
  if (!query.data) return <ReportSkeleton />;

  const report = query.data;
  const anomalyTypes = Object.entries(report.anomalies.byClassification ?? {})
    .filter(([, count]) => Number.isFinite(count))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const remediationCount = report.remediation.suggested.length + report.remediation.executed.length;

  return (
    <article aria-labelledby="technical-report-title" className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 id="technical-report-title" className="text-base font-bold text-gray-900">Technical Report</h2>
          <p className="text-xs text-gray-500 mt-1">
            Backend-aggregated details for <span className="font-semibold text-gray-700">{report.incident.title}</span>
            {report.incident.id ? <span className="font-mono"> · {report.incident.id}</span> : null}
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <p className="text-[10px] text-gray-400 whitespace-nowrap">Generated {formatTimestamp(report.generatedAt)}</p>
          <IncidentReportExport incidentId={incidentId ?? report.incident.id} />
        </div>
      </header>

      <ReportSection title="Incident Summary">
        <p className="text-sm text-gray-700 leading-relaxed">{report.summary.description || "No summary available."}</p>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <Definition label="Suspected cause" value={report.summary.suspectedCause || "Not identified"} />
          <Definition label="Confirmed root cause" value={report.summary.rootCause || "Root cause not confirmed"} />
        </dl>
      </ReportSection>

      <section aria-labelledby="incident-metrics-title">
        <h3 id="incident-metrics-title" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Incident Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <Metric label="Duration" value={formatMillis(report.incident.durationMs)} />
          <Metric label="Anomalies" value={report.anomalies.total} />
          <Metric label="Code findings" value={report.codeAnalysis.totalFindings} />
          <Metric label="Critical findings" value={report.codeAnalysis.criticalFindings} />
          <Metric label="Affected services" value={report.incident.affectedServices.length} />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ReportSection title="Anomalies" icon={ShieldAlert} detail={`${report.anomalies.total} total`}>
          {report.anomalies.total === 0 || anomalyTypes.length === 0 ? (
            <EmptyState title="No anomalies recorded for this incident." className="py-8" />
          ) : (
            <dl className="divide-y divide-gray-100">
              {anomalyTypes.map(([classification, count]) => (
                <div key={classification} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-sm text-gray-700">{classificationLabel(classification)}</dt>
                  <dd className="text-sm font-bold text-gray-900 font-mono">{count}</dd>
                </div>
              ))}
            </dl>
          )}
        </ReportSection>

        <ReportSection title="Related Service Health" icon={HeartPulse} detail={`${report.health.services.length} services`}>
          {report.health.services.length === 0 ? (
            <EmptyState title="Service health data unavailable." className="py-8" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="pb-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service</th>
                    <th scope="col" className="pb-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="pb-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Observed</th>
                  </tr>
                </thead>
                <tbody>
                  {report.health.services.map((service) => (
                    <tr key={`${service.service}-${service.observedAt ?? "latest"}`} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-gray-800">
                        {service.service}
                        {service.summary && <span className="block text-xs font-normal text-gray-400 mt-0.5">{service.summary}</span>}
                      </td>
                      <td className="py-2.5 pr-3"><StatusPill status={service.status} label={titleCase(service.status)} /></td>
                      <td className="py-2.5 text-xs text-gray-400 whitespace-nowrap">{formatTimestamp(service.observedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportSection>
      </div>

      <ReportSection title="Code Analysis" icon={Code2} detail={`${report.codeAnalysis.totalFindings} findings · ${report.codeAnalysis.criticalFindings} critical`}>
        {report.codeAnalysis.findings.length === 0 ? (
          <EmptyState title="No code analysis findings available." className="py-8" />
        ) : (
          <BoundedFindings findings={report.codeAnalysis.findings} />
        )}
      </ReportSection>

      <ReportSection title="Recorded Remediation" icon={Wrench} detail={`${remediationCount} actions`}>
        {remediationCount === 0 ? (
          <EmptyState title="No remediation actions recorded." className="py-8" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RemediationList title="Suggested Actions" entries={report.remediation.suggested} />
            <RemediationList title="Executed Actions" entries={report.remediation.executed} />
          </div>
        )}
      </ReportSection>

      <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        The normalized incident timeline is shown in the Evidence tab to avoid displaying it twice.
      </p>
    </article>
  );
}

function ReportSection({ title, icon: Icon, detail, children }) {
  return (
    <section className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-white" aria-label={title}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-gray-400" aria-hidden="true" />}
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
        {detail && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{detail}</span>}
      </div>
      {children}
    </section>
  );
}

function Definition({ label, value }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-lg p-3"><dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</dt><dd className="text-sm text-gray-700 mt-1">{value}</dd></div>;
}

function Metric({ label, value }) {
  return <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-w-0"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p><p className="text-xl font-bold text-gray-900 font-mono mt-1 truncate">{value}</p></div>;
}

function RemediationList({ title, entries }) {
  const visible = entries.slice(0, 20);
  const remaining = entries.slice(20);
  return (
    <section aria-label={title}>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
      {entries.length === 0 ? <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-3">None recorded.</p> : (
        <div className="space-y-2">
          <RemediationEntries entries={visible} />
          {remaining.length > 0 && <details className="border border-gray-200 rounded-lg p-3"><summary className="text-xs font-semibold text-blue-600 cursor-pointer">Show {remaining.length} more actions</summary><div className="space-y-2 mt-3"><RemediationEntries entries={remaining} /></div></details>}
        </div>
      )}
    </section>
  );
}

function BoundedFindings({ findings }) {
  const visible = findings.slice(0, 20);
  const remaining = findings.slice(20);
  return <div className="space-y-2"><FindingEntries findings={visible} />{remaining.length > 0 && <details className="border border-gray-200 rounded-lg p-3"><summary className="text-xs font-semibold text-blue-600 cursor-pointer">Show {remaining.length} more findings</summary><div className="space-y-2 mt-3"><FindingEntries findings={remaining} /></div></details>}</div>;
}

function FindingEntries({ findings }) {
  return findings.map((finding) => <div key={finding.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-gray-900">{finding.title}</p>{finding.location && <p className="text-xs font-mono text-gray-500 mt-0.5 break-all">{finding.location}</p>}</div><StatusPill status={finding.severity} /></div>{finding.description && <p className="text-sm text-gray-600 leading-relaxed mt-2">{finding.description}</p>}</div>);
}

function RemediationEntries({ entries }) {
  return entries.map((entry) => <div key={entry.id} className="border border-gray-200 rounded-lg p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-gray-900">{entry.title}</p>{entry.occurredAt && <time className="text-[10px] text-gray-400 whitespace-nowrap">{formatTimestamp(entry.occurredAt)}</time>}</div>{entry.description && <p className="text-xs text-gray-600 leading-relaxed mt-1">{entry.description}</p>}</div>);
}

function ReportSkeleton() {
  return (
    <div aria-label="Loading technical report" className="space-y-5 animate-pulse">
      <div className="space-y-2"><div className="h-5 bg-gray-200 rounded w-40" /><div className="h-3 bg-gray-100 rounded w-64 max-w-full" /></div>
      <div className="h-36 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-20 bg-gray-100 rounded-lg" />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="h-44 bg-gray-100 rounded-xl" /><div className="h-44 bg-gray-100 rounded-xl" /></div>
    </div>
  );
}

function ReportError({ onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <AlertTriangle size={32} className="text-red-400 mb-3" aria-hidden="true" />
      <p className="text-sm font-semibold text-gray-800">Technical report could not be loaded.</p>
      <p className="text-xs text-gray-500 mt-1.5">The rest of the incident remains available.</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 flex items-center gap-2 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg"><RefreshCw size={12} aria-hidden="true" /> Retry</button>}
    </div>
  );
}
