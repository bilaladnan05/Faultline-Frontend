import { Download, FileText, FileJson, FileSpreadsheet, Hash, BarChart3 } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { showToast } from "../components/ui/Toast";
import { mttrTrend, incidentFrequency, codeQuality, anomalyStats, slackTickets, generatedReports } from "../mocks/reports";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

const REPORT_TYPE_STYLES = {
  "Incident Summary": "bg-red-50 text-red-600",
  "Code Quality": "bg-blue-50 text-blue-600",
  "Performance": "bg-green-50 text-green-600",
  "Anomaly": "bg-purple-50 text-purple-600",
};

export default function ReportingPage() {
  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Reports"]}
        action={
          <div className="flex items-center gap-2">
            {[
              { icon: FileText, label: "PDF", ext: "pdf" },
              { icon: FileJson, label: "JSON", ext: "json" },
              { icon: FileSpreadsheet, label: "CSV", ext: "csv" },
            ].map(({ icon: Icon, label, ext }) => (
              <button
                key={label}
                onClick={() => showToast(`${label} export started. Download will begin shortly.`)}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reporting &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Code quality metrics, anomaly statistics, and incident trends. <span className="font-semibold text-blue-600">FR-12</span></p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Avg MTTR", value: "38m", delta: "-12% vs last month", green: true },
            { label: "Incidents This Month", value: "24", delta: "+3 vs last month", green: false },
            { label: "Code Quality Score", value: `${codeQuality.score}/100`, delta: `${codeQuality.issues} issues`, green: codeQuality.score >= 80 },
            { label: "Anomalies Detected", value: anomalyStats.total, delta: `${anomalyStats.resolved} resolved`, green: true },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
              <p className={`text-xs mt-1 font-semibold ${c.green ? "text-green-600" : "text-red-500"}`}>{c.delta}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5">
          {/* MTTR Trend — FR-12 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">MTTR Trend</h2>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">FR-12</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mttrTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} unit="m" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="mttr" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Incident Frequency */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Incident Frequency by Severity</h2>
              <BarChart3 size={15} className="text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidentFrequency} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="critical" fill="#EF4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="high" fill="#F97316" radius={[3, 3, 0, 0]} />
                <Bar dataKey="medium" fill="#EAB308" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Code Quality + Anomalies */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Code Quality Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "Security Vulnerabilities", value: codeQuality.security, max: 10, color: "bg-red-500" },
                { label: "Code Smells", value: codeQuality.smells, max: 50, color: "bg-yellow-400" },
                { label: "Duplications", value: `${codeQuality.duplications}%`, pct: codeQuality.duplications, color: "bg-orange-400" },
                { label: "Test Coverage", value: `${codeQuality.coverage}%`, pct: codeQuality.coverage, color: "bg-green-500" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 font-medium">{m.label}</span>
                    <span className="text-xs font-bold text-gray-900">{m.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.color}`}
                      style={{ width: m.pct !== undefined ? `${m.pct}%` : `${(m.value / m.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Anomaly Statistics</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Total Detected", value: anomalyStats.total, color: "text-gray-900" },
                { label: "Resolved", value: anomalyStats.resolved, color: "text-green-600" },
                { label: "False Positives", value: anomalyStats.falsePositives, color: "text-yellow-600" },
                { label: "Avg Detection Time", value: anomalyStats.avgDetectionTime, color: "text-blue-600" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slack Tickets */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Hash size={15} className="text-gray-600" />
            <h2 className="text-sm font-bold text-gray-900">Slack Tickets Created</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Incident ID", "Channel", "Created", "Status", "Resolved By"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slackTickets.map((t, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-xs font-bold text-gray-500">{t.incidentId}</td>
                  <td className="px-5 py-3 text-xs font-mono text-blue-600">{t.channel}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{t.created}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.status === "Resolved" ? "bg-green-50 text-green-600 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-700">{t.resolvedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Generated Reports */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Generated Reports</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {generatedReports.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${REPORT_TYPE_STYLES[r.type] || "bg-gray-50 text-gray-500"}`}>
                    <FileText size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.date} · {r.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "generating" ? (
                    <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full animate-pulse">
                      Generating…
                    </span>
                  ) : (
                    <div className="flex gap-1.5">
                      {["PDF", "JSON"].map((fmt) => (
                        <button key={fmt} onClick={() => showToast(`${fmt} export started.`)} className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 px-2.5 py-1 rounded-md">
                          <Download size={10} /> {fmt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
