import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Gauge, Zap, ArrowUpRight, RefreshCw, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";
import { AsyncSection, ErrorState, LoadingState, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource, livePollMs } from "../hooks/useApiResource";
import { getReadiness, listIncidents, queryMetrics, TIMELINE_METRIC_NAMES } from "../api/endpoints";
import {
  adaptIncident,
  aggregateBucketsAcrossSeries,
  classificationLabel,
  formatAge,
  formatMetricValue,
  metricLabel,
  severityRank,
} from "../api/adapters";
import { METRIC_RANGES, bucketForRange, findRange, windowEndingNow } from "../api/window";
import { useProject } from "../context/useProject";

const CHART_METRICS = TIMELINE_METRIC_NAMES.filter((name) => !name.endsWith("limit"));

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const clusterId = activeProject?.clusterId;

  const [rangeKey, setRangeKey] = useState("6h");
  const [metricName, setMetricName] = useState(CHART_METRICS[0]);
  const range = findRange(METRIC_RANGES, rangeKey);

  const incidents = useApiResource(
    ({ signal }) => listIncidents({ cluster: clusterId }, { signal }),
    [clusterId],
    { pollMs: livePollMs, enabled: Boolean(clusterId) },
  );

  const readiness = useApiResource(({ signal }) => getReadiness({ signal }), [], { pollMs: livePollMs });

  // A fresh window each time the range or metric changes; the API refuses an unbounded one.
  const metrics = useApiResource(
    ({ signal }) => {
      const window = windowEndingNow(range.durationMs);
      return queryMetrics(
        {
          clusterId,
          metricName,
          ...window,
          bucketMs: bucketForRange(range.durationMs),
          aggregations: ["avg", "max"],
        },
        { signal },
      );
    },
    [clusterId, metricName, range.durationMs],
    { pollMs: livePollMs, enabled: Boolean(clusterId) },
  );

  const adapted = useMemo(() => (incidents.data ?? []).map(adaptIncident), [incidents.data]);

  const stats = useMemo(() => {
    const open = adapted.filter((incident) => incident.rawStatus !== "RESOLVED");
    const resolved = adapted.filter((incident) => incident.resolvedAt);
    const critical = open.filter((incident) => incident.severity === "CRITICAL").length;

    const meanConfidence = adapted.length
      ? Math.round(adapted.reduce((total, incident) => total + incident.confidence, 0) / adapted.length)
      : null;

    return [
      {
        label: "OPEN INCIDENTS",
        value: String(open.length),
        icon: AlertTriangle,
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        delta: `${critical} critical · ${adapted.length} total recorded`,
        deltaColor: critical ? "text-red-500" : "text-gray-400",
      },
      {
        label: "RESOLVED INCIDENTS",
        value: String(resolved.length),
        icon: CheckCircle2,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        delta: resolved.length ? "recorded by this cluster" : "no resolved incidents yet",
        deltaColor: "text-gray-400",
      },
      {
        label: "MEAN CONFIDENCE",
        value: meanConfidence === null ? "—" : `${meanConfidence}%`,
        icon: Gauge,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        progress: meanConfidence ?? 0,
        delta: "evidence score, not a probability",
        deltaColor: "text-gray-400",
      },
      {
        label: "ANOMALIES CORRELATED",
        value: String(adapted.reduce((total, incident) => total + incident.anomalies.length, 0)),
        icon: Zap,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
        delta: `${adapted.reduce((total, incident) => total + incident.evidence.length, 0)} evidence entries`,
        deltaColor: "text-gray-400",
      },
    ];
  }, [adapted]);

  const chart = useMemo(
    () => aggregateBucketsAcrossSeries(metrics.data?.items ?? []),
    [metrics.data],
  );

  const priority = useMemo(
    () =>
      [...adapted]
        .filter((incident) => incident.rawStatus !== "RESOLVED")
        .sort(
          (a, b) =>
            severityRank(b.severity) - severityRank(a.severity) || Date.parse(b.lastSeen) - Date.parse(a.lastSeen),
        )
        .slice(0, 6),
    [adapted],
  );

  const readinessStatus = readiness.data?.status ?? readiness.error?.body?.status ?? "unavailable";

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={activeProject ? ["Deployments", activeProject.name, "Dashboard"] : ["Home", "Dashboard"]}
        action={
          <button
            type="button"
            onClick={() => {
              incidents.refetch();
              metrics.refetch();
              readiness.refetch();
            }}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={incidents.refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activeProject?.name ?? "Cluster"} Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Incidents and telemetry recorded by Faultline for cluster{" "}
              <span className="font-semibold text-gray-700">{clusterId}</span>.
            </p>
          </div>
          <div
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${
              readinessStatus === "ok"
                ? "bg-blue-50 border-blue-100 text-blue-700"
                : readinessStatus === "degraded"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                  : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                readinessStatus === "ok" ? "bg-blue-500" : readinessStatus === "degraded" ? "bg-yellow-500" : "bg-red-500"
              }`}
            />
            {readinessStatus === "ok"
              ? "API operational"
              : readinessStatus === "degraded"
                ? "API degraded"
                : "API unavailable"}
          </div>
        </div>

        <StaleBanner error={incidents.data ? incidents.error : null} onRetry={incidents.refetch} />

        {/* Stat cards */}
        {incidents.loading && !incidents.data ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <LoadingState label="Loading incident summary…" />
          </div>
        ) : incidents.error && !incidents.data ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <ErrorState error={incidents.error} onRetry={incidents.refetch} />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1 leading-none font-mono">{stat.value}</p>
                  </div>
                  <div className={`w-9 h-9 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <stat.icon size={16} className={stat.iconColor} />
                  </div>
                </div>
                {stat.progress !== undefined && (
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stat.progress}%` }} />
                  </div>
                )}
                {stat.delta && <p className={`text-xs font-semibold mt-2 ${stat.deltaColor}`}>{stat.delta}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Metric chart + severity breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-gray-900">{metricLabel(metricName)}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cluster-wide average and peak
                  {chart.seriesCount > 1 ? ` across ${chart.seriesCount} reporting resources` : ""}
                  {chart.unit ? ` · ${chart.unit}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={metricName}
                  onChange={(event) => setMetricName(event.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CHART_METRICS.map((name) => (
                    <option key={name} value={name}>
                      {metricLabel(name)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  {METRIC_RANGES.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setRangeKey(option.key)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                        rangeKey === option.key
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AsyncSection
              loading={metrics.loading}
              error={metrics.error}
              data={metrics.data}
              onRetry={metrics.refetch}
              loadingLabel="Loading metrics…"
              isEmpty={() => chart.data.length === 0}
              emptyIcon={Activity}
              emptyTitle="No metric samples in this window"
              emptyHint={`No ${metricLabel(metricName)} samples were recorded for ${clusterId} in the last ${range.label}.`}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chart.data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  {/* Byte-valued metrics run to ten digits; format the ticks or they clip. */}
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                    tickFormatter={(value) => formatMetricValue(value, chart.unit)}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value) => formatMetricValue(value, chart.unit)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={2} dot={false} name="Average" />
                  <Line type="monotone" dataKey="peak" stroke="#f59e0b" strokeWidth={2} dot={false} name="Peak" />
                </LineChart>
              </ResponsiveContainer>
            </AsyncSection>
          </div>

          {/* Severity + classification breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-900">Open by Severity</h2>
            {["CRITICAL", "HIGH", "WARNING", "INFO"].map((severity) => {
              const count = adapted.filter(
                (incident) => incident.rawStatus !== "RESOLVED" && incident.severity === severity,
              ).length;
              const total = adapted.filter((incident) => incident.rawStatus !== "RESOLVED").length || 1;
              return (
                <div key={severity} className="flex items-center gap-3">
                  <StatusPill status={severity} className="w-24 justify-center" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.round((count / total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}

            <h2 className="text-sm font-bold text-gray-900 mt-3 pt-3 border-t border-gray-100">Top Classifications</h2>
            {topClassifications(adapted).length === 0 ? (
              <p className="text-xs text-gray-400">No incidents recorded.</p>
            ) : (
              topClassifications(adapted).map(([classification, count]) => (
                <div key={classification} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">{classificationLabel(classification)}</span>
                  <span className="text-xs font-bold text-gray-700">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Highest-priority open incidents */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Highest-Priority Open Incidents</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ranked by severity, then most recent activity</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/incidents")}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              View Incident Manager <ArrowUpRight size={11} />
            </button>
          </div>
          <AsyncSection
            loading={incidents.loading}
            error={incidents.error}
            data={incidents.data}
            onRetry={incidents.refetch}
            loadingLabel="Loading incidents…"
            isEmpty={() => priority.length === 0}
            emptyTitle="No open incidents"
            emptyHint={`Faultline has nothing open for ${clusterId} right now.`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["SEVERITY", "RESOURCE", "SUMMARY", "AGE", "TYPE", "STATUS"].map((header) => (
                      <th
                        key={header}
                        className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priority.map((incident) => (
                    <tr
                      key={incident.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/incidents/${encodeURIComponent(incident.id)}`)}
                    >
                      <td className="px-5 py-3.5">
                        <StatusPill status={incident.severity} />
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {incident.service}
                        <span className="block text-[11px] text-gray-400">{incident.namespace ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-sm truncate">{incident.summary}</td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatAge(incident.firstSeen)}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{incident.classificationLabel}</td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={incident.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AsyncSection>
        </div>
      </div>
    </div>
  );
}

function topClassifications(incidents) {
  const counts = new Map();
  for (const incident of incidents) {
    counts.set(incident.classification, (counts.get(incident.classification) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
}
