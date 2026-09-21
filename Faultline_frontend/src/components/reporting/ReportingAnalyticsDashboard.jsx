import { Activity, AlertTriangle, HeartPulse, RefreshCw } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { classificationLabel, formatTimestamp, titleCase } from "../../api/adapters";
import { INCIDENT_SEVERITIES } from "../../api/endpoints";
import StatusPill from "../ui/StatusPill";
import ReportingMetricCards from "./ReportingMetricCards";

const SEVERITY_STYLES = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  WARNING: "bg-yellow-400",
  INFO: "bg-blue-500",
};

export default function ReportingAnalyticsDashboard({ analytics, trends, summary }) {
  return (
    <div className="space-y-5">
      <ReportingMetricCards query={analytics} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <IncidentTrendChart query={trends} />
        </div>
        <SystemHealthSummary query={summary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        <SeverityBreakdown query={analytics} />
        <TopAffectedServices query={summary} />
        <IncidentCategories query={summary} />
      </div>
    </div>
  );
}

function SystemHealthSummary({ query }) {
  if (query.loading && !query.data) return <SectionSkeleton label="Loading system health" />;
  if (query.error && !query.data) return <SectionUnavailable title="System Health" message="System health unavailable" onRetry={query.refetch} />;
  const health = query.data?.health;
  if (!health?.available) return <SectionUnavailable title="System Health" message="System health unavailable" onRetry={query.refetch} />;

  return (
    <section aria-labelledby="system-health-title" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2"><HeartPulse size={15} className="text-gray-400" aria-hidden="true" /><h2 id="system-health-title" className="text-sm font-bold text-gray-900">System Health</h2></div>
        <StatusPill status={health.overallStatus} label={titleCase(health.overallStatus)} />
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <HealthCount label="Healthy" value={health.healthyServices} className="text-green-600" />
        <HealthCount label="Degraded" value={health.degradedServices} className="text-yellow-700" />
        <HealthCount label="Unhealthy" value={health.unhealthyServices} className="text-red-600" />
      </dl>
    </section>
  );
}

function IncidentTrendChart({ query }) {
  if (query.loading && !query.data) return <SectionSkeleton label="Loading incident trend" tall />;
  if (query.error && !query.data) return <SectionUnavailable title="Incident Trend" message="Incident trend unavailable" onRetry={query.refetch} tall />;
  const points = query.data?.points ?? [];

  return (
    <section aria-labelledby="incident-trend-title" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div><h2 id="incident-trend-title" className="text-sm font-bold text-gray-900">Incident Frequency</h2><p className="text-xs text-gray-400 mt-0.5">Backend-provided {query.data?.bucket ?? "time"} buckets</p></div>
        <Activity size={16} className="text-gray-400" aria-hidden="true" />
      </div>
      {points.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-center"><div><Activity size={30} className="text-gray-300 mx-auto mb-2" aria-hidden="true" /><p className="text-sm font-medium text-gray-500">No incidents recorded in this period.</p></div></div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="timestamp" tickFormatter={formatTrendTick} tick={{ fontSize: 10, fill: "#9CA3AF" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} allowDecimals={false} />
              <Tooltip labelFormatter={formatTimestamp} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="total" name="Total" stroke="#2563EB" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="critical" name="Critical" stroke="#EF4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <table className="sr-only">
            <caption>Incident frequency values</caption>
            <thead><tr><th>Time</th><th>Total</th><th>Critical</th><th>Resolved</th></tr></thead>
            <tbody>{points.map((point) => <tr key={point.timestamp}><td>{formatTimestamp(point.timestamp)}</td><td>{point.total}</td><td>{point.critical}</td><td>{point.resolved}</td></tr>)}</tbody>
          </table>
        </>
      )}
    </section>
  );
}

function SeverityBreakdown({ query }) {
  if (query.loading && !query.data) return <SectionSkeleton label="Loading severity breakdown" />;
  if (query.error && !query.data) return <SectionUnavailable title="Incidents by Severity" message="Severity breakdown unavailable" onRetry={query.refetch} />;
  const counts = query.data?.incidentsBySeverity ?? {};
  const largest = Math.max(1, ...INCIDENT_SEVERITIES.map((severity) => counts[severity] ?? 0));
  return (
    <section aria-labelledby="severity-title" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 id="severity-title" className="text-sm font-bold text-gray-900 mb-4">Incidents by Severity</h2>
      <div className="space-y-3">
        {INCIDENT_SEVERITIES.map((severity) => {
          const count = counts[severity] ?? 0;
          return <div key={severity} className="grid grid-cols-[88px_1fr_32px] items-center gap-3"><StatusPill status={severity} /><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${SEVERITY_STYLES[severity]}`} style={{ width: `${(count / largest) * 100}%` }} /></div><span className="text-sm font-bold text-gray-700 text-right">{count}</span></div>;
        })}
      </div>
    </section>
  );
}

function TopAffectedServices({ query }) {
  if (query.loading && !query.data) return <SectionSkeleton label="Loading affected services" />;
  if (query.error && !query.data) return <SectionUnavailable title="Top Affected Services" message="Affected-service data unavailable" onRetry={query.refetch} />;
  const services = query.data?.topAffectedServices ?? [];
  return <RankedList title="Top Affected Services" empty="No affected services in this period." items={services.map((item) => ({ key: item.service, label: item.service, count: item.incidentCount }))} />;
}

function IncidentCategories({ query }) {
  if (query.loading && !query.data) return <SectionSkeleton label="Loading incident categories" />;
  if (query.error && !query.data) return null;
  const categories = query.data?.commonIncidentCategories ?? [];
  if (categories.length === 0) return null;
  return <RankedList title="Common Incident Categories" items={categories.map((item) => ({ key: item.classification, label: classificationLabel(item.classification), count: item.incidentCount }))} />;
}

function RankedList({ title, empty, items }) {
  return (
    <section aria-label={title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-4">{title}</h2>
      {items.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">{empty}</p> : <ol className="divide-y divide-gray-100">{items.slice(0, 5).map((item, index) => <li key={item.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"><span className="text-xs font-bold text-gray-300 w-4">{index + 1}</span><span className="text-sm text-gray-700 flex-1 truncate">{item.label}</span><span className="text-sm font-bold text-gray-900">{item.count}</span></li>)}</ol>}
    </section>
  );
}

function HealthCount({ label, value, className }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center"><dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</dt><dd className={`text-2xl font-bold font-mono mt-1 ${className}`}>{value}</dd></div>;
}

function SectionSkeleton({ label, tall = false }) {
  return <div aria-label={label} className={`bg-gray-200 rounded-xl animate-pulse ${tall ? "h-[354px]" : "h-56"}`} />;
}

function SectionUnavailable({ title, message, onRetry, tall = false }) {
  return (
    <section aria-label={title} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center text-center ${tall ? "min-h-[354px]" : "min-h-56"}`}>
      <AlertTriangle size={26} className="text-gray-300 mb-2" aria-hidden="true" /><h2 className="text-sm font-bold text-gray-900">{title}</h2><p className="text-xs text-gray-500 mt-1">{message}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"><RefreshCw size={11} aria-hidden="true" /> Retry</button>}
    </section>
  );
}

function formatTrendTick(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
