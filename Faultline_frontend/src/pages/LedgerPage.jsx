import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Filter, Lock, RefreshCw, ScrollText } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource, livePollMs } from "../hooks/useApiResource";
import { listIncidents } from "../api/endpoints";
import { classificationLabel, formatTimestamp, sourceLabel, titleCase } from "../api/adapters";
import { useProject } from "../context/useProject";

/**
 * The ledger is every incident's timeline entries, merged and ordered newest first.
 *
 * These entries are the record Faultline actually keeps — an anomaly opened, stayed
 * active, or resolved — each stamped with the anomaly that caused it and the detection
 * source that produced it. Approval and remediation entries are not here because the API
 * records no such actions yet.
 */
const TYPE_STYLES = {
  ANOMALY_OPENED: "bg-red-50 text-red-700 border border-red-200",
  ANOMALY_ACTIVE: "bg-orange-50 text-orange-700 border border-orange-200",
  ANOMALY_RESOLVED: "bg-green-50 text-green-700 border border-green-200",
};

const SOURCE_STYLES = {
  DETERMINISTIC: "bg-gray-100 text-gray-600",
  STATISTICAL: "bg-purple-50 text-purple-700",
  LOG_CLASSIFIER: "bg-indigo-50 text-indigo-700",
};

const SEVERITY_STYLES = {
  CRITICAL: "bg-red-50 text-red-600 border-red-200",
  HIGH: "bg-orange-50 text-orange-600 border-orange-200",
  WARNING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  INFO: "bg-blue-50 text-blue-600 border-blue-200",
};

export default function LedgerPage() {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const clusterId = activeProject?.clusterId;

  const [typeFilter, setTypeFilter] = useState("All");
  const [incidentFilter, setIncidentFilter] = useState("All");

  const query = useApiResource(
    ({ signal }) => listIncidents({ cluster: clusterId }, { signal }),
    [clusterId],
    { pollMs: livePollMs, enabled: Boolean(clusterId) },
  );

  const entries = useMemo(() => {
    const rows = (query.data ?? []).flatMap((incident) =>
      (incident.timeline ?? []).map((entry) => ({
        ...entry,
        incidentId: incident.id,
        incidentTitle: incident.title,
        classification: entry.classification,
        incidentClassification: incident.classification,
      })),
    );
    return rows.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }, [query.data]);

  const types = useMemo(() => ["All", ...new Set(entries.map((entry) => entry.type))], [entries]);
  const incidentIds = useMemo(() => ["All", ...new Set(entries.map((entry) => entry.incidentId))], [entries]);

  const filtered = entries.filter(
    (entry) =>
      (typeFilter === "All" || entry.type === typeFilter) &&
      (incidentFilter === "All" || entry.incidentId === incidentFilter),
  );

  const stats = [
    { label: "Ledger Entries", value: entries.length, color: "text-gray-900" },
    {
      label: "Statistical Findings",
      value: entries.filter((entry) => entry.source === "STATISTICAL").length,
      color: "text-purple-600",
    },
    {
      label: "Log Classifications",
      value: entries.filter((entry) => entry.source === "LOG_CLASSIFIER").length,
      color: "text-indigo-600",
    },
    { label: "Incidents Covered", value: new Set(entries.map((entry) => entry.incidentId)).size, color: "text-gray-700" },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={activeProject ? ["Deployments", activeProject.name, "Incident Ledger"] : ["Incident Ledger"]}
        action={
          <button
            type="button"
            onClick={query.refetch}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={query.refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Lock size={18} className="text-gray-600" />
              Incident Ledger
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Every timeline entry Faultline recorded for{" "}
              <span className="font-semibold text-gray-700">{clusterId}</span>, newest first. Detection events only —
              the API records no approval or remediation actions.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full">
            <Lock size={11} />
            READ ONLY
          </div>
        </div>

        <StaleBanner error={query.data ? query.error : null} onRetry={query.refetch} />

        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={11} /> Filter
          </span>
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={types}
            format={(value) => (value === "All" ? "All" : titleCase(value))}
          />
          <FilterSelect
            label="Incident"
            value={incidentFilter}
            onChange={setIncidentFilter}
            options={incidentIds}
            format={(value) => (value === "All" ? "All" : value.slice(0, 8))}
          />
          <span className="ml-auto text-xs text-gray-400">{filtered.length} entries</span>
        </div>

        <AsyncSection
          loading={query.loading}
          error={query.error}
          data={query.data}
          onRetry={query.refetch}
          loadingLabel="Loading ledger…"
          isEmpty={() => filtered.length === 0}
          emptyIcon={ScrollText}
          emptyTitle={entries.length ? "No entries match these filters" : "No ledger entries"}
          emptyHint={
            entries.length ? "Try another type or incident." : `No incident timeline has been recorded for ${clusterId}.`
          }
        >
          <div className="space-y-3">
            {filtered.map((entry, index) => (
              <div key={entry.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-4">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-blue-200 mt-1" />
                  {index < filtered.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 min-h-6" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          TYPE_STYLES[entry.type] ?? "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {titleCase(entry.type)}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/incidents/${encodeURIComponent(entry.incidentId)}`)}
                        className="text-xs font-bold text-blue-600 font-mono hover:underline"
                      >
                        {entry.incidentId.slice(0, 8)}
                      </button>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          SEVERITY_STYLES[entry.severity] ?? "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {entry.severity}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 font-medium leading-relaxed mb-1">{entry.summary}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    {classificationLabel(entry.classification)} · incident “{entry.incidentTitle}”
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <span className="text-xs font-bold text-gray-700">Detected by</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        SOURCE_STYLES[entry.source] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {sourceLabel(entry.source)}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-300 font-mono">anomaly {entry.anomalyId.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AsyncSection>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, format = (option) => option }) {
  return (
    <div className="relative inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
      <span className="font-medium text-gray-500">{label}:</span>
      <span className="text-blue-600 font-semibold">{format(value)}</span>
      <ChevronDown size={12} className="text-gray-400" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
