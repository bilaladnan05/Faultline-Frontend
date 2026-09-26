import { useMemo, useState } from "react";
import TopBar from "../components/layout/TopBar";
import ReportingAnalyticsDashboard from "../components/reporting/ReportingAnalyticsDashboard";
import ReportingDateRange from "../components/reporting/ReportingDateRange";
import { createReportingRange } from "../components/reporting/reportingRange";
import { useIncidentAnalytics, useIncidentTrends, useSystemSummary } from "../hooks/useReporting";

export default function ReportingPage() {
  const [rangeKey, setRangeKey] = useState("7d");
  // Freeze the anchor until the range changes so all three endpoints receive the exact
  // same window and polling/re-renders do not continuously invalidate the queries.
  const range = useMemo(() => createReportingRange(rangeKey), [rangeKey]);
  const filters = { from: range.from, to: range.to };
  const analytics = useIncidentAnalytics(filters);
  const trends = useIncidentTrends({ ...filters, bucket: range.bucket });
  const summary = useSystemSummary(filters);

  return <div className="flex flex-col flex-1">
    <TopBar breadcrumbs={["Reports", "Analytics"]} />
    <main className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"><div><h1 className="text-xl font-bold text-gray-900">Incident Reporting</h1><p className="text-sm text-gray-500 mt-1">Backend-calculated incident metrics, trends, and system health.</p></div><ReportingDateRange value={rangeKey} onChange={setRangeKey} /></div>
      <ReportingAnalyticsDashboard analytics={analytics} trends={trends} summary={summary} />
    </main>
  </div>;
}
