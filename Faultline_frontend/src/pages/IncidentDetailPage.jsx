import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronRight, Bot, User, RotateCcw, TerminalSquare, ArrowLeft, CheckCircle2, Circle, GitBranch } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";
import { getIncidentById, incidents } from "../mocks/incidents";

const LOG_COLORS = { INFO: "text-blue-500", WARN: "text-yellow-500", ERROR: "text-red-500", DEBUG: "text-gray-400" };

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const incident = getIncidentById(id) || incidents[0];
  const [activeTab, setActiveTab] = useState("ai");
  const [selectedChannel, setSelectedChannel] = useState("#prod-engineering");

  if (!incident) return <div className="p-8 text-gray-400">Incident not found.</div>;

  const tabs = [
    { key: "ai", label: "AI Insights", icon: Bot },
    { key: "logs", label: "Logs", icon: TerminalSquare },
    { key: "map", label: "Service Map", icon: GitBranch },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Incidents", incident.id, "Detail"]}
        action={
          <button
            onClick={() => navigate(`/incidents/${id}/pr`)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <GitBranch size={14} />
            Issue PR
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Back */}
        <button onClick={() => navigate("/incidents")} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
          <ArrowLeft size={14} /> Back to Incidents
        </button>

        {/* Stepper — FR-07 visible demo */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            {incident.timeline.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  {step.done ? (
                    <CheckCircle2 size={28} className="text-blue-600" />
                  ) : (
                    <Circle size={28} className="text-gray-300" />
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${step.done ? "text-blue-600" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
                {i < incident.timeline.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step.done && incident.timeline[i + 1]?.done ? "bg-blue-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Incident header card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-lg font-bold text-gray-900">{incident.title}</h1>
            <StatusPill status={incident.severity} />
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">IMPACTED SERVICE</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{incident.service}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ESTIMATED IMPACT</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{incident.impact}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ELAPSED TIME</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 font-mono">{incident.elapsedTime}</p>
            </div>
          </div>
        </div>

        {/* Main content + side rail */}
        <div className="grid grid-cols-3 gap-5 items-start">
          {/* Main panel */}
          <div className="col-span-2 space-y-4">
            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 bg-gray-50/40">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === "ai" && <AIInsightsTab incident={incident} />}
                {activeTab === "logs" && <LogsTab incident={incident} />}
                {activeTab === "map" && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <GitBranch size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Service Map visualization</p>
                    <p className="text-xs mt-1">Interactive dependency graph — backend integration required</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side rail */}
          <div className="space-y-4">
            {/* Remediation Choice — FR-09 / FR-10 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                ⚙️ Remediation Choice
                <span className="text-[10px] text-orange-500 font-bold bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">FR-09 · FR-10</span>
              </h3>

              {/* AI path */}
              <div className="border border-gray-100 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Bot size={14} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Assign to AI Agent</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">AI will draft a PR and run validation tests. Pre-execution safety check will be performed automatically.</p>
                <div className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded px-2 py-1 mb-2">
                  ⚠ Safety check required before execution (FR-09)
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                  ▶ Execute Auto-Fix
                </button>
              </div>

              {/* Human path */}
              <div className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <User size={14} className="text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">Escalate to Developer</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Notify a specific team or channel. Human approval required for high-severity actions (FR-10).</p>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mb-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>#prod-engineering</option>
                  <option>#platform-team</option>
                  <option>#infrastructure</option>
                  <option>#sre-oncall</option>
                </select>
                <button className="w-full border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 text-sm font-semibold py-2 rounded-lg transition-colors">
                  💬 Create Slack Ticket
                </button>
              </div>
            </div>

            {/* Manual Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Manual Actions</h3>
              {[
                { label: "Restart Service", sub: "ROLLING RESTART PODS", icon: RotateCcw },
                { label: "Rollback Deployment", sub: `REVERT TO V${incident.service.split(" v")[1] - 1 || "2.3.11"}`, icon: ArrowLeft },
              ].map((a) => (
                <div key={a.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{a.sub}</p>
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Affected Assets */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Affected Assets</h3>
              {incident.affectedAssets.map((a) => (
                <div key={a.name} className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-2 last:mb-0 text-sm font-medium ${a.severity === "critical" ? "bg-red-50 text-red-700 border border-red-100" : "bg-orange-50 text-orange-700 border border-orange-100"}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === "critical" ? "bg-red-500" : "bg-orange-400"}`} />
                  {a.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIInsightsTab({ incident }) {
  const { rca } = incident;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Bot size={18} className="text-blue-600" />
        <h3 className="text-sm font-bold text-gray-900">Root Cause Analysis</h3>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full ml-auto">FR-07 · FR-08</span>
      </div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        MODEL: {rca.model} · {rca.confidence}% CONFIDENCE
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">OBSERVATION</p>
          <p className="text-sm text-gray-700 leading-relaxed">{rca.observation}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">DIAGNOSIS</p>
          <p className="text-sm text-gray-700 leading-relaxed">{rca.diagnosis}</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TRACE LOGS</span>
          <button className="text-xs text-gray-400 hover:text-gray-600">Copy</button>
        </div>
        <div className="p-3 font-mono text-[12px] bg-gray-900 max-h-44 overflow-y-auto space-y-1">
          {rca.logs.map((l, i) => (
            <div key={i} className={`flex gap-3 ${l.highlight ? "bg-red-900/30 -mx-3 px-3 py-0.5 rounded" : ""}`}>
              <span className="text-gray-500 flex-shrink-0">{l.ts}</span>
              <span className={`flex-shrink-0 font-bold ${LOG_COLORS[l.level]}`}>[{l.level}]</span>
              <span className="text-gray-200">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogsTab({ incident }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">FR-05 · Live log tail for {incident.service}</p>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-900 p-3 font-mono text-[12px] max-h-72 overflow-y-auto space-y-1.5">
          {incident.rca.logs.map((l, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-gray-500">{l.ts}</span>
              <span className={`font-bold flex-shrink-0 ${LOG_COLORS[l.level]}`}>[{l.level}]</span>
              <span className="text-gray-200">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
