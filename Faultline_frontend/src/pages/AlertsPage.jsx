import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, RefreshCw } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource, livePollMs } from "../hooks/useApiResource";
import { listIncidents, INCIDENT_SEVERITIES } from "../api/endpoints";
import { adaptIncident, formatAge, formatTimestamp, severityRank, sourceLabel } from "../api/adapters";
import { useProject } from "../context/ProjectContext";

const FILTERS = ["all", ...INCIDENT_SEVERITIES];

/**
 * Alerts are the unresolved incidents Faultline is currently reporting. The API has no
 * separate alert stream, and inventing one would mean showing something the backend
 * cannot confirm.
 */
export default function AlertsPage() {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const clusterId = activeProject?.clusterId;
  const [activeFilter, setActiveFilter] = useState("all");

  const query = useApiResource(
    ({ signal }) => listIncidents({ cluster: clusterId }, { signal }),
    [clusterId],
    { pollMs: livePollMs, enabled: Boolean(clusterId) },
  );

  const alerts = useMemo(
    () =>
      (query.data ?? [])
        .map(adaptIncident)
        .filter((incident) => incident.rawStatus !== "RESOLVED")
        .sort(
          (a, b) =>
            severityRank(b.severity) - severityRank(a.severity) || Date.parse(b.lastSeen) - Date.parse(a.lastSeen),
        ),
    [query.data],
  );

  const filtered = activeFilter === "all" ? alerts : alerts.filter((alert) => alert.severity === activeFilter);

  const counts = useMemo(
    () =>
      INCIDENT_SEVERITIES.reduce((acc, severity) => {
        acc[severity] = alerts.filter((alert) => alert.severity === severity).length;
        return acc;
      }, {}),
    [alerts],
  );

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={activeProject ? ["Deployments", activeProject.name, "Alerts"] : ["Alerts"]}
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Alerts</h1>
            <p className="text-sm text-gray-500 mt-1">
              Unresolved incidents Faultline is currently reporting for{" "}
              <span className="font-semibold text-gray-700">{clusterId}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {INCIDENT_SEVERITIES.map((severity) => (
              <div key={severity} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-sm font-bold text-gray-900">{counts[severity] ?? 0}</span>
                <span className="text-[11px] font-medium text-gray-400">{severity}</span>
              </div>
            ))}
          </div>
        </div>

        <StaleBanner error={query.data ? query.error : null} onRetry={query.refetch} />

        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeFilter === filter ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter === "all" ? "All Alerts" : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">{filtered.length} alerts</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <AsyncSection
            loading={query.loading}
            error={query.error}
            data={query.data}
            onRetry={query.refetch}
            loadingLabel="Loading alerts…"
            isEmpty={() => filtered.length === 0}
            emptyIcon={Bell}
            emptyTitle={alerts.length ? "No alerts at this severity" : "No open alerts"}
            emptyHint={
              alerts.length ? "Try another severity filter." : `Nothing is unresolved in ${clusterId} right now.`
            }
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["SEVERITY", "RESOURCE", "ISSUE", "NAMESPACE", "AGE", "DETECTED BY", "STATUS", "ACTION"].map(
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
                {filtered.map((alert) => {
                  const sources = [...new Set(alert.anomalies.map((anomaly) => anomaly.source))];
                  return (
                    <tr
                      key={alert.id}
                      className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/incidents/${encodeURIComponent(alert.id)}`)}
                    >
                      <td className="px-5 py-4">
                        <StatusPill status={alert.severity} />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{alert.service}</p>
                        <p className="text-xs text-gray-400">{alert.classificationLabel}</p>
                      </td>
                      <td className="px-5 py-4 max-w-sm text-gray-700">
                        <p className="truncate">{alert.summary}</p>
                        <p className="text-[11px] text-gray-400">last seen {formatTimestamp(alert.lastSeen)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {alert.namespace ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{formatAge(alert.firstSeen)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {sources.length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            sources.map((source) => (
                              <span
                                key={source}
                                className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full"
                              >
                                {sourceLabel(source)}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={alert.status} />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/incidents/${encodeURIComponent(alert.id)}`);
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          INVESTIGATE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AsyncSection>
        </div>
      </div>
    </div>
  );
}
