import { useMemo } from "react";
import { Download, FileText, FileJson, FileSpreadsheet, Hash, BarChart3, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import TopBar from "../components/layout/TopBar";
import { showToast } from "../components/ui/Toast";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource } from "../hooks/useApiResource";
import { listIncidents } from "../api/endpoints";
import { adaptIncident, classificationLabel, formatMillis, sourceLabel } from "../api/adapters";
import { codeQuality, slackTickets, generatedReports } from "../mocks/reports";
import { useProject } from "../context/ProjectContext";

const REPORT_TYPE_STYLES = {
  "Incident Summary": "bg-red-50 text-red-600",
  "Code Quality": "bg-blue-50 text-blue-600",
  Performance: "bg-green-50 text-green-600",
  Anomaly: "bg-purple-50 text-purple-600",
};

const DAY_MS = 86_400_000;

export default function ReportingPage() {
  const { activeProject } = useProject();
  const clusterId = activeProject?.clusterId;

  const query = useApiResource(
    ({ signal }) => listIncidents({ cluster: clusterId }, { signal }),
    [clusterId],
    { enabled: Boolean(clusterId) },
  );

  const incidents = useMemo(() => (query.data ?? []).map(adaptIncident), [query.data]);
  const analytics = useMemo(() => buildAnalytics(incidents), [incidents]);

  /** Exports the incidents this page is actually reporting on, as served by the API. */
  const exportData = (format) => {
    if (!query.data?.length) {
      showToast("Nothing to export yet.");
      return;
    }
    const rows = incidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      classification: incident.classification,
      severity: incident.severity,
      status: incident.rawStatus,
      cluster: incident.clusterId,
      namespace: incident.namespace ?? "",
      resource: incident.service,
      confidence: incident.confidence,
      firstSeen: incident.firstSeen,
      lastSeen: incident.lastSeen,
      resolvedAt: incident.resolvedAt ?? "",
    }));

    const content =
      format === "csv"
        ? [
            Object.keys(rows[0]).join(","),
            ...rows.map((row) =>
              Object.values(row)
                .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                .join(","),
            ),
          ].join("\n")
        : JSON.stringify(rows, null, 2);

    const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `faultline-incidents-${clusterId}-${new Date().toISOString().slice(0, 10)}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${format.toUpperCase()} export downloaded (${rows.length} incidents).`);
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={activeProject ? ["Deployments", activeProject.name, "Reports"] : ["Reports"]}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={query.refetch}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw size={13} className={query.refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => showToast("PDF export is not implemented — use JSON or CSV.")}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-400 text-sm font-semibold px-3 py-1.5 rounded-lg"
            >
              <FileText size={13} /> PDF
            </button>
            <button
              type="button"
              onClick={() => exportData("json")}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <FileJson size={13} /> JSON
            </button>
            <button
              type="button"
              onClick={() => exportData("csv")}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <FileSpreadsheet size={13} /> CSV
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reporting &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Computed from every incident the API has recorded for{" "}
            <span className="font-semibold text-gray-700">{clusterId}</span>. JSON and CSV export the same rows.
          </p>
        </div>

        <StaleBanner error={query.data ? query.error : null} onRetry={query.refetch} />

        <AsyncSection
          loading={query.loading}
          error={query.error}
          data={query.data}
          onRetry={query.refetch}
          loadingLabel="Loading incident analytics…"
          isEmpty={() => incidents.length === 0}
          emptyIcon={BarChart3}
          emptyTitle="No incidents to report on"
          emptyHint={`Faultline has recorded no incidents for ${clusterId} yet.`}
        >
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: "Mean Resolution",
                  value: analytics.meanResolutionMs === null ? "—" : formatMillis(analytics.meanResolutionMs),
                  delta: `${analytics.resolvedCount} resolved of ${incidents.length}`,
                  green: true,
                },
                {
                  label: "Open Incidents",
                  value: String(analytics.openCount),
                  delta: `${analytics.criticalOpen} critical`,
                  green: analytics.criticalOpen === 0,
                },
                {
                  label: "Anomalies Correlated",
                  value: String(analytics.anomalyCount),
                  delta: `${analytics.evidenceCount} evidence entries`,
                  green: true,
                },
                {
                  label: "Mean Confidence",
                  value: analytics.meanConfidence === null ? "—" : `${analytics.meanConfidence}%`,
                  delta: "evidence score, not a probability",
                  green: true,
                },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{card.value}</p>
                  <p className={`text-xs mt-1 font-semibold ${card.green ? "text-green-600" : "text-red-500"}`}>
                    {card.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900">Mean Resolution by Day</h2>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">minutes</span>
                </div>
                {analytics.resolutionTrend.length === 0 ? (
                  <p className="text-xs text-gray-400 py-16 text-center">No resolved incidents to trend yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={analytics.resolutionTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} unit="m" />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="minutes" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900">Incidents by Day and Severity</h2>
                  <BarChart3 size={15} className="text-gray-400" />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.frequency} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="CRITICAL" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="HIGH" stackId="a" fill="#F97316" />
                    <Bar dataKey="WARNING" stackId="a" fill="#EAB308" />
                    <Bar dataKey="INFO" stackId="a" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Classification + detection source breakdown */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Incidents by Classification</h2>
                <div className="space-y-3">
                  {analytics.classifications.map(([classification, count]) => (
                    <div key={classification}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-700 font-medium">{classificationLabel(classification)}</span>
                        <span className="text-xs font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.round((count / incidents.length) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Anomalies by Detection Source</h2>
                <div className="grid grid-cols-2 gap-3">
                  {analytics.sources.map(([source, count]) => (
                    <div key={source} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {sourceLabel(source)}
                      </p>
                      <p className="text-xl font-bold mt-0.5 text-gray-900">{count}</p>
                    </div>
                  ))}
                  {analytics.sources.length === 0 && (
                    <p className="text-xs text-gray-400">No anomalies attached to these incidents.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AsyncSection>

        {/* Sections with no API source. Kept visible, labelled so nobody reads them as real. */}
        <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-5">
          <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
            Sample data — the API exposes no code-quality, Slack or report-generation endpoints.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Code Quality Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "Security Vulnerabilities", value: codeQuality.security, max: 10, color: "bg-red-500" },
                { label: "Code Smells", value: codeQuality.smells, max: 50, color: "bg-yellow-400" },
                {
                  label: "Duplications",
                  value: `${codeQuality.duplications}%`,
                  pct: codeQuality.duplications,
                  color: "bg-orange-400",
                },
                { label: "Test Coverage", value: `${codeQuality.coverage}%`, pct: codeQuality.coverage, color: "bg-green-500" },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 font-medium">{metric.label}</span>
                    <span className="text-xs font-bold text-gray-900">{metric.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${metric.color}`}
                      style={{ width: metric.pct !== undefined ? `${metric.pct}%` : `${(metric.value / metric.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Hash size={15} className="text-gray-600" />
              <h2 className="text-sm font-bold text-gray-900">Slack Tickets Created</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Incident ID", "Channel", "Created", "Status", "Resolved By"].map((header) => (
                    <th key={header} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slackTickets.map((ticket, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs font-bold text-gray-500">{ticket.incidentId}</td>
                    <td className="px-5 py-3 text-xs font-mono text-blue-600">{ticket.channel}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{ticket.created}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ticket.status === "Resolved"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-700">{ticket.resolvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Generated Reports</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {generatedReports.map((report, index) => (
                <div key={index} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        REPORT_TYPE_STYLES[report.type] || "bg-gray-50 text-gray-500"
                      }`}
                    >
                      <FileText size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{report.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {report.date} · {report.size}
                      </p>
                    </div>
                  </div>
                  {report.status === "generating" ? (
                    <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full animate-pulse">
                      Generating…
                    </span>
                  ) : (
                    <div className="flex gap-1.5">
                      {["PDF", "JSON"].map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => showToast("Stored report downloads are not backed by the API.")}
                          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 border border-gray-200 px-2.5 py-1 rounded-md"
                        >
                          <Download size={10} /> {format}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** All reporting figures, derived from the incidents the API returned. */
function buildAnalytics(incidents) {
  const resolved = incidents.filter((incident) => incident.resolvedAt);
  const open = incidents.filter((incident) => incident.rawStatus !== "RESOLVED");

  const meanResolutionMs = resolved.length
    ? resolved.reduce(
        (total, incident) => total + (Date.parse(incident.resolvedAt) - Date.parse(incident.firstSeen)),
        0,
      ) / resolved.length
    : null;

  // Daily buckets over the range the incidents actually cover, oldest first.
  const byDay = new Map();
  for (const incident of incidents) {
    const day = new Date(Math.floor(Date.parse(incident.firstSeen) / DAY_MS) * DAY_MS).toISOString().slice(5, 10);
    const bucket = byDay.get(day) ?? { day, CRITICAL: 0, HIGH: 0, WARNING: 0, INFO: 0, resolvedMs: 0, resolved: 0 };
    bucket[incident.severity] = (bucket[incident.severity] ?? 0) + 1;
    if (incident.resolvedAt) {
      bucket.resolvedMs += Date.parse(incident.resolvedAt) - Date.parse(incident.firstSeen);
      bucket.resolved += 1;
    }
    byDay.set(day, bucket);
  }
  const days = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));

  const classifications = [...incidents.reduce((counts, incident) => {
    counts.set(incident.classification, (counts.get(incident.classification) ?? 0) + 1);
    return counts;
  }, new Map())].sort((a, b) => b[1] - a[1]);

  const sources = [...incidents.reduce((counts, incident) => {
    for (const anomaly of incident.anomalies) {
      counts.set(anomaly.source, (counts.get(anomaly.source) ?? 0) + 1);
    }
    return counts;
  }, new Map())].sort((a, b) => b[1] - a[1]);

  return {
    meanResolutionMs,
    resolvedCount: resolved.length,
    openCount: open.length,
    criticalOpen: open.filter((incident) => incident.severity === "CRITICAL").length,
    anomalyCount: incidents.reduce((total, incident) => total + incident.anomalies.length, 0),
    evidenceCount: incidents.reduce((total, incident) => total + incident.evidence.length, 0),
    meanConfidence: incidents.length
      ? Math.round(incidents.reduce((total, incident) => total + incident.confidence, 0) / incidents.length)
      : null,
    frequency: days,
    resolutionTrend: days
      .filter((day) => day.resolved > 0)
      .map((day) => ({ day: day.day, minutes: Math.round(day.resolvedMs / day.resolved / 60000) })),
    classifications,
    sources,
  };
}
