import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search, RefreshCw, AlertTriangle } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource, livePollMs } from "../hooks/useApiResource";
import { listIncidents, INCIDENT_STATUSES, INCIDENT_SEVERITIES, INCIDENT_CLASSIFICATIONS } from "../api/endpoints";
import { adaptIncident, classificationLabel, formatAge, severityRank } from "../api/adapters";
import { useProject } from "../context/useProject";

export default function IncidentsListPage() {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const clusterId = activeProject?.clusterId;

  const [search, setSearch] = useState("");
  const [namespace, setNamespace] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("All");
  const [classification, setClassification] = useState("All");

  // Status, severity, namespace and classification are filtered by the API; free-text
  // search is applied here because the incidents endpoint has no search parameter.
  const query = useApiResource(
    ({ signal }) =>
      listIncidents(
        {
          cluster: clusterId,
          namespace: namespace === "All" ? undefined : namespace,
          status: status === "All" ? undefined : status,
          severity: severity === "All" ? undefined : severity,
          classification: classification === "All" ? undefined : classification,
        },
        { signal },
      ),
    [clusterId, namespace, status, severity, classification],
    { pollMs: livePollMs, enabled: Boolean(clusterId) },
  );

  const incidents = useMemo(() => (query.data ?? []).map(adaptIncident), [query.data]);

  const namespaces = useMemo(() => {
    const fromProject = activeProject?.namespaces ?? [];
    const fromData = incidents.map((incident) => incident.namespace).filter(Boolean);
    return ["All", ...new Set([...fromProject, ...fromData])];
  }, [activeProject, incidents]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = term
      ? incidents.filter((incident) =>
          [incident.title, incident.id, incident.summary, incident.service, incident.classification]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(term)),
        )
      : incidents;
    // Worst and freshest first — the order an operator triages in.
    return [...matches].sort(
      (a, b) =>
        severityRank(b.severity) - severityRank(a.severity) ||
        Date.parse(b.lastSeen) - Date.parse(a.lastSeen),
    );
  }, [incidents, search]);

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={activeProject ? ["Deployments", activeProject.name, "Incidents"] : ["Incidents"]}
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">Incidents List</h1>
          <p className="text-sm text-gray-500 mt-1">
            Incidents correlated by the Faultline detection core in{" "}
            <span className="font-semibold text-gray-700">{clusterId ?? "no cluster"}</span>. Refreshes every{" "}
            {Math.round(livePollMs / 1000)}s.
          </p>
        </div>

        <StaleBanner error={query.data ? query.error : null} onRetry={query.refetch} />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search incidents..."
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 placeholder:text-gray-400"
            />
          </div>

          <FilterDropdown label="Status" value={status} onChange={setStatus} options={["All", ...INCIDENT_STATUSES]} />
          <FilterDropdown
            label="Severity"
            value={severity}
            onChange={setSeverity}
            options={["All", ...INCIDENT_SEVERITIES]}
          />
          {namespaces.length > 1 && (
            <FilterDropdown label="Namespace" value={namespace} onChange={setNamespace} options={namespaces} />
          )}
          <FilterDropdown
            label="Type"
            value={classification}
            onChange={setClassification}
            options={["All", ...INCIDENT_CLASSIFICATIONS]}
            format={(value) => (value === "All" ? "All" : classificationLabel(value))}
          />

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            {query.data ? `${filtered.length} of ${incidents.length} incidents` : "—"}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <AsyncSection
            loading={query.loading}
            error={query.error}
            data={query.data}
            onRetry={query.refetch}
            loadingLabel="Loading incidents…"
            isEmpty={() => filtered.length === 0}
            emptyIcon={search ? Search : AlertTriangle}
            emptyTitle={search || incidents.length ? "No incidents match your filters" : "No incidents recorded"}
            emptyHint={
              search || incidents.length
                ? "Try adjusting the search or filters."
                : `Faultline has not correlated any incidents in ${clusterId} yet.`
            }
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["ID", "INCIDENT SUMMARY", "SEVERITY", "STATUS", "RESOURCE", "AGE", "CONFIDENCE", "ACTION"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((incident) => (
                  <tr
                    key={incident.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/incidents/${encodeURIComponent(incident.id)}`)}
                  >
                    <td className="px-5 py-4 font-bold text-gray-400 text-xs tracking-wide font-mono">
                      {incident.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-semibold text-gray-900 leading-snug">{incident.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{incident.summary}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {incident.classificationLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={incident.severity} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={incident.status} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-800 font-medium text-xs">{incident.service}</p>
                      <p className="text-[11px] text-gray-400">{incident.namespace ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatAge(incident.firstSeen, incident.resolvedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${incident.confidence}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{incident.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/incidents/${encodeURIComponent(incident.id)}`);
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline tracking-wide"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AsyncSection>
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({ label, value, onChange, options, format = (option) => option }) {
  return (
    <div className="relative inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 select-none">
      <span className="font-medium">{label}:</span>
      <span className="text-blue-600 font-semibold">{format(value)}</span>
      <ChevronDown size={13} className="text-gray-400" />
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
