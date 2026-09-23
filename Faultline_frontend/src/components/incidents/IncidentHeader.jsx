import StatusPill from "../ui/StatusPill";
import { formatMillis, formatTimestamp } from "../../api/adapters";

/** Existing incident header, enhanced only when technical-report data is available. */
export default function IncidentHeader({ incident, report }) {
  return (
    <header className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h1 className="text-lg font-bold text-gray-900">{incident.title}</h1>
        <StatusPill status={incident.severity} />
        <StatusPill status={incident.status} />
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {incident.classificationLabel}
        </span>
      </div>
      <p className="text-[11px] font-mono text-gray-400 mb-2">{incident.id}</p>
      <p className="text-sm text-gray-600 mb-4">{incident.summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <Field label="Primary resource" value={incident.service} mono />
        <Field label="Cluster / namespace" value={`${incident.clusterId} / ${incident.namespace ?? "—"}`} />
        <Field label="Impact" value={incident.impact} />
        <Field label="Duration" value={report ? formatMillis(report.incident.durationMs) : incident.elapsedTime} mono />
        <Field label="Confidence" value={`${incident.confidence}%`} />
      </div>

      {report?.incident.affectedServices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Affected services</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {report.incident.affectedServices.map((service) => (
              <span key={service} className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-4 pt-4 border-t border-gray-100">
        <Field label="Detected" value={formatTimestamp(incident.firstSeen)} />
        <Field label="Last seen" value={formatTimestamp(incident.lastSeen)} />
        <Field label="Acknowledged" value={formatTimestamp(report?.incident.acknowledgedAt)} />
        <Field label="Resolved" value={incident.resolvedAt ? formatTimestamp(incident.resolvedAt) : "—"} />
      </div>
    </header>
  );
}

function Field({ label, value, mono = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold text-gray-900 mt-1 truncate ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}
