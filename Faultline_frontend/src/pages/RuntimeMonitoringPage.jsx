import { useState } from "react";
import { Search, Pause, Play, Filter, X } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { liveLogs, aiDecisions } from "../mocks/logs";

const LEVEL_STYLE = {
  INFO: "text-blue-400",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
  DEBUG: "text-gray-500",
};

export default function RuntimeMonitoringPage() {
  const [paused, setPaused] = useState(false);
  const [autoRemediate, setAutoRemediate] = useState(true);
  const [search, setSearch] = useState("");
  const [wsUrl] = useState("wss://api.production.com/stream");

  const filtered = search
    ? liveLogs.filter((l) => l.msg.toLowerCase().includes(search.toLowerCase()) || l.level.toLowerCase().includes(search.toLowerCase()))
    : liveLogs;

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Runtime", "Monitoring"]} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Runtime Monitoring</h1>
            <p className="text-sm text-gray-500 mt-0.5">Real-time application execution metrics and logs. <span className="font-semibold text-blue-600">FR-05 · FR-06</span></p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            System Healthy
          </div>
        </div>

        {/* WS Config */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 flex-shrink-0">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            WebSocket Config
          </div>
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="flex-1 min-w-48">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Server URL</p>
              <input defaultValue={wsUrl} className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly />
            </div>
            <div className="min-w-40">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Auth Token</p>
              <input type="password" defaultValue="sk-faultline-prod-token" className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="self-end">
              <button className="flex items-center gap-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                <X size={13} /> Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Connection Status</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Status", value: "Connected", cls: "text-green-600 font-bold" },
              { label: "Latency", value: "24ms", cls: "font-bold text-gray-900" },
              { label: "Uptime", value: "14d 03h 22m", cls: "font-bold text-gray-900" },
              { label: "Messages/min", value: "1,204", cls: "font-bold text-gray-900" },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
                <p className={`text-lg mt-0.5 ${m.cls}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Body: Log Stream + AI Decisions */}
        <div className="grid grid-cols-3 gap-5 items-start">
          {/* Log Stream — FR-05, FR-06 */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Live Log Stream</h2>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <Search size={12} className="absolute left-2.5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={() => setPaused((v) => !v)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${paused ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {paused ? <Play size={12} /> : <Pause size={12} />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <Filter size={12} /> Filter
                </button>
              </div>
            </div>
            <div className="bg-gray-950 font-mono text-[12px] log-scroll p-3 space-y-1">
              {paused && (
                <div className="flex items-center gap-2 bg-yellow-900/30 text-yellow-300 text-[11px] font-semibold px-3 py-1.5 rounded mb-2 border border-yellow-700/30">
                  <Pause size={11} /> Log stream paused
                </div>
              )}
              {filtered.length === 0 ? (
                <p className="text-gray-500 text-center py-8 font-sans">No matching log entries.</p>
              ) : (
                filtered.map((l) => (
                  <div key={l.id} className="flex gap-3 hover:bg-white/5 px-1 py-0.5 rounded">
                    <span className="text-gray-600 flex-shrink-0">{l.ts}</span>
                    <span className={`flex-shrink-0 font-bold w-12 ${LEVEL_STYLE[l.level]}`}>[{l.level}]</span>
                    <span className="text-gray-500 text-[10px] flex-shrink-0">{l.source}</span>
                    <span className={`${l.level === "ERROR" ? "text-red-300" : "text-gray-300"}`}>{l.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Decisions — FR-06 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Intelligent Response</h2>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">ACTIVE · FR-06</span>
            </div>

            {/* Auto-remediation toggle */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Auto-Remediation</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Execute predefined playbooks automatically</p>
              </div>
              <button
                onClick={() => setAutoRemediate((v) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoRemediate ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${autoRemediate ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold py-2 rounded-lg">
              + Issue Incident
            </button>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent AI Decisions</p>
              <div className="space-y-3">
                {aiDecisions.map((d) => (
                  <div key={d.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900">{d.title}</span>
                      <span className="text-[10px] text-gray-400">{d.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{d.detail}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.status === "resolved" ? "bg-green-50 text-green-600 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
