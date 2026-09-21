import { AlertTriangle, CheckCircle2, Clock, Gauge, ListChecks, Siren, Timer } from "lucide-react";
import { formatMillis, formatPercentage } from "../../api/adapters";

export default function ReportingMetricCards({ query }) {
  if (query.loading && !query.data) return <MetricSkeleton />;
  if (query.error && !query.data) return <MetricError onRetry={query.refetch} />;

  const analytics = query.data;
  if (!analytics) return <MetricSkeleton />;
  const cards = [
    { label: "Total Incidents", value: analytics.totalIncidents, icon: ListChecks },
    { label: "Open Incidents", value: analytics.openIncidents, icon: AlertTriangle },
    { label: "Resolved Incidents", value: analytics.resolvedIncidents, icon: CheckCircle2 },
    { label: "Critical Incidents", value: analytics.criticalIncidents, icon: Siren },
    { label: "MTTR", value: analytics.mttrMs === null ? "N/A" : formatMillis(analytics.mttrMs), icon: Clock },
    { label: "MTTA", value: analytics.mttaMs === null ? "N/A" : formatMillis(analytics.mttaMs), icon: Timer },
    { label: "Resolution Rate", value: formatPercentage(analytics.resolutionRate), icon: Gauge },
  ];

  return (
    <section aria-labelledby="reporting-metrics-title">
      <h2 id="reporting-metrics-title" className="sr-only">Incident analytics metrics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
              <Icon size={14} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2 font-mono truncate">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricSkeleton() {
  return <div aria-label="Loading incident analytics" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 animate-pulse">{[0, 1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-24 bg-gray-200 rounded-xl" />)}</div>;
}

function MetricError({ onRetry }) {
  return (
    <div role="alert" className="bg-white rounded-xl border border-red-200 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <AlertTriangle size={20} className="text-red-400" aria-hidden="true" />
      <div className="flex-1"><p className="text-sm font-semibold text-gray-800">Incident analytics unavailable</p><p className="text-xs text-gray-500 mt-0.5">Other reporting sections remain available.</p></div>
      {onRetry && <button type="button" onClick={onRetry} className="text-xs font-bold text-blue-600 hover:underline">Retry</button>}
    </div>
  );
}
