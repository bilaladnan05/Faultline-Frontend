import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import ReportingAnalyticsDashboard from "../components/reporting/ReportingAnalyticsDashboard";
import ReportingDateRange from "../components/reporting/ReportingDateRange";
import { createReportingRange } from "../components/reporting/reportingRange";
import { useIncidentAnalytics, useIncidentTrends, useSystemSummary } from "../hooks/useReporting";
import { useProject } from "../context/useProject";

export default function ReportingPage() {
  const { activeProject } = useProject();
  const [rangeKey, setRangeKey] = useState("7d");
  const [rangeAnchor, setRangeAnchor] = useState(() => Date.now());
  const range = useMemo(() => createReportingRange(rangeKey, rangeAnchor), [rangeKey, rangeAnchor]);

  const analytics = useIncidentAnalytics({ from: range.from, to: range.to });
  const trends = useIncidentTrends({ from: range.from, to: range.to, bucket: range.bucket });
  const summary = useSystemSummary({ from: range.from, to: range.to });
  const refreshing = analytics.refreshing || trends.refreshing || summary.refreshing;

  const selectRange = (key) => {
    setRangeKey(key);
    setRangeAnchor(Date.now());
  };

  const refresh = () => {
    // Advancing the bounded range changes all query keys and requests together.
    setRangeAnchor((previous) => Math.max(Date.now(), previous + 1));
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <TopBar
        breadcrumbs={activeProject ? ["Deployments", activeProject.name, "Reports"] : ["Reports"]}
        action={
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reporting &amp; Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              System-level incident performance and health for {range.label.toLowerCase()}.
            </p>
          </div>
          <ReportingDateRange value={rangeKey} onChange={selectRange} />
        </div>

        <ReportingAnalyticsDashboard analytics={analytics} trends={trends} summary={summary} />
      </main>
    </div>
  );
}
