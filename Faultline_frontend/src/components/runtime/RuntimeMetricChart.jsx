import { Activity, BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  aggregateBucketsAcrossSeries,
  formatMetricValue,
  metricLabel,
} from "../../api/adapters";
import { AsyncSection } from "../ui/AsyncState";

const SERIES = {
  average: { label: "Average", color: "#2563EB" },
  peak: { label: "Peak", color: "#F59E0B" },
};

export default function RuntimeMetricChart({ query }) {
  const available = (query.data ?? []).filter((entry) => entry.items.length > 0);
  const [requestedMetric, setRequestedMetric] = useState("");
  const active = available.find((entry) => entry.metricName === requestedMetric) ?? available[0];
  const chart = aggregateBucketsAcrossSeries(active?.items ?? []);

  return (
    <section aria-labelledby="runtime-metrics-title" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={17} aria-hidden="true" />
          </div>
          <div>
            <h2 id="runtime-metrics-title" className="text-sm font-bold text-gray-900">Runtime metrics</h2>
            <p className="text-xs text-gray-400 mt-0.5">Five-minute buckets from the last hour. Only metrics with samples are shown.</p>
          </div>
        </div>
        {available.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Available metrics">
            {available.map((entry) => {
              const selected = entry.metricName === active?.metricName;
              return (
                <button
                  key={entry.metricName}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setRequestedMetric(entry.metricName)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    selected
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {metricLabel(entry.metricName)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AsyncSection
        {...query}
        data={query.data}
        onRetry={query.refetch}
        loadingLabel="Loading runtime metrics…"
        isEmpty={() => available.length === 0}
        emptyTitle="No metric samples in this window"
        emptyHint="Metric selectors appear automatically when the collector reports data."
        emptyIcon={Activity}
      >
        {active && (
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">{metricLabel(active.metricName)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {chart.seriesCount} resource {chart.seriesCount === 1 ? "series" : "series"} combined
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500">
                {Object.entries(SERIES).map(([key, series]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: series.color }} />
                    {series.label}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chart.data} margin={{ top: 4, right: 10, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} minTickGap={24} />
                <YAxis width={72} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(value) => compactMetricValue(value, chart.unit)} />
                <Tooltip
                  formatter={(value, key) => [formatMetricValue(Number(value), chart.unit), SERIES[key]?.label ?? key]}
                  labelFormatter={(label) => `Time ${label}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Line type="monotone" dataKey="average" stroke={SERIES.average.color} strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="peak" stroke={SERIES.peak.color} strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <table className="sr-only">
              <caption>{metricLabel(active.metricName)} values</caption>
              <thead><tr><th>Time</th><th>Average</th><th>Peak</th></tr></thead>
              <tbody>{chart.data.map((point) => <tr key={point.bucketStart}><td>{point.bucketStart}</td><td>{point.average}</td><td>{point.peak}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </AsyncSection>
    </section>
  );
}

function compactMetricValue(value, unit) {
  if (unit === "By" || unit === "bytes") {
    if (Math.abs(value) >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GiB`;
    if (Math.abs(value) >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(0)} MiB`;
    if (Math.abs(value) >= 1024) return `${(value / 1024).toFixed(0)} KiB`;
  }
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Number(value.toFixed(Math.abs(value) < 10 ? 2 : 0));
}
