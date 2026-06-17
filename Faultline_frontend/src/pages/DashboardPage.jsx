import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Heart, Zap, Plus, TrendingDown, TrendingUp, ArrowUpRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";

const uptimeData = [
  { day: "Mon", uptime: 99.9, latency: 82 },
  { day: "Tue", uptime: 99.8, latency: 91 },
  { day: "Wed", uptime: 99.9, latency: 78 },
  { day: "Thu", uptime: 98.2, latency: 240 },
  { day: "Fri", uptime: 99.7, latency: 105 },
  { day: "Sat", uptime: 99.9, latency: 88 },
  { day: "Sun", uptime: 99.9, latency: 76 },
];

const alerts = [
  { id: "FL-101", severity: "CRITICAL", service: "Edge Gateway", issue: "Error rate 18.2% (5xx) Spike in US-East...", duration: "14 min", owner: "Faultline Bot", status: "Investigating" },
  { id: "FL-102", severity: "HIGH", service: "Auth Service", issue: "Login latency increased 340ms above baseline...", duration: "22 min", owner: "Alex Morgan", status: "Assigned" },
  { id: "FL-103", severity: "MEDIUM", service: "Payments", issue: "Retry queue buildup detected after deploy...", duration: "41 min", owner: "Sam Smith", status: "Monitoring" },
];

const stats = [
  { label: "ACTIVE INCIDENTS", value: "12", icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-500", delta: "+14% vs yesterday", deltaIcon: TrendingUp, deltaColor: "text-red-500" },
  { label: "MTTR", value: "18m", icon: Clock, iconBg: "bg-blue-50", iconColor: "text-blue-500", delta: "↓2m improvement", deltaColor: "text-green-600" },
  { label: "HEALTH SCORE", value: "98.2", icon: Heart, iconBg: "bg-blue-50", iconColor: "text-blue-500", progress: 98, deltaColor: "text-gray-400" },
  { label: "AI INSIGHT FIXES", value: "76%", icon: Zap, iconBg: "bg-purple-50", iconColor: "text-purple-500", delta: "↑5% accuracy improvement", deltaColor: "text-green-600" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [chartRange, setChartRange] = useState("7d");

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Home", "Dashboard"]}
        action={
          <div className="flex items-center gap-2">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Select Repository</option>
              <option>faultline/checkout-api</option>
              <option>faultline/auth-service</option>
            </select>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
              <Zap size={13} />
              Run Static Analysis
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">System Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Real-time health telemetry and AI incident orchestration.</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            System Operational
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1 leading-none">{s.value}</p>
                </div>
                <div className={`w-9 h-9 ${s.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={16} className={s.iconColor} />
                </div>
              </div>
              {s.progress && (
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progress}%` }} />
                </div>
              )}
              {s.delta && <p className={`text-xs font-semibold mt-2 ${s.deltaColor}`}>{s.delta}</p>}
            </div>
          ))}
        </div>

        {/* Chart + AI Panel */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">System Performance</h2>
                <p className="text-xs text-gray-400 mt-0.5">Latency &amp; Error trends across global regions</p>
              </div>
              <div className="flex gap-1">
                {["24h", "7d"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${chartRange === r ? "bg-blue-50 text-blue-600 border-blue-200" : "text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={uptimeData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} name="Uptime %" />
                <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} name="Latency (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI Panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900">Faultline AI</h2>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full tracking-wider">OPTIMIZING</span>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">Capacity Warning</span>
                <span className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-bold">92% Prob.</span>
              </div>
              <p className="text-xs text-gray-700">Service 'auth-broker' is nearing resource limits in eu-central-1. Upscale recommended.</p>
              <button className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline">Execute Auto-Scale <ArrowUpRight size={11} /></button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">Route Analysis</span>
                <span className="text-[10px] bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 font-bold">Stable</span>
              </div>
              <p className="text-xs text-gray-700">Network paths for APAC traffic have normalized after rerouting through CloudFront.</p>
              <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">View Details <ArrowUpRight size={11} /></button>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Active High-Priority Alerts</h2>
              <p className="text-xs text-gray-400 mt-0.5">Critical items requiring immediate intervention</p>
            </div>
            <button onClick={() => navigate("/incidents")} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
              View Incident Manager <ArrowUpRight size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["SEVERITY", "SERVICE", "ISSUE DESCRIPTION", "DURATION", "OWNER", "STATUS"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/incidents/${a.id}`)}>
                    <td className="px-5 py-3.5"><StatusPill status={a.severity} /></td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{a.service}</td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">{a.issue}</td>
                    <td className="px-5 py-3.5 text-gray-500">{a.duration}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-600 rounded-full text-white text-[9px] font-bold flex items-center justify-center">AI</span>
                        <span className="text-gray-700">{a.owner}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusPill status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
