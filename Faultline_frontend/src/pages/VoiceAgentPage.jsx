import { useState } from "react";
import { Phone, PhoneOff, PhoneCall, ChevronDown, ChevronUp, Settings } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";
import { voiceCalls, escalationSettings } from "../mocks/voiceCalls";

const OUTCOME_STYLES = {
  Answered: "bg-green-50 text-green-700 border border-green-200",
  "No Answer": "bg-gray-100 text-gray-500 border border-gray-200",
  Escalated: "bg-orange-50 text-orange-700 border border-orange-200",
};

const OUTCOME_ICONS = {
  Answered: Phone,
  "No Answer": PhoneOff,
  Escalated: PhoneCall,
};

export default function VoiceAgentPage() {
  const [expanded, setExpanded] = useState(null);
  const [retryCount, setRetryCount] = useState(escalationSettings.retryCount);
  const [escalateTo, setEscalateTo] = useState(escalationSettings.escalateToName);

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Voice Agent"]} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Phone size={18} className="text-gray-600" />
              Voice Agent — Automated Calls
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Outbound call log for automated incident escalation via voice. <span className="font-semibold text-blue-600">FR-13</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
            <Phone size={11} /> Twilio · Active
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Calls", value: voiceCalls.length, color: "text-gray-900" },
            { label: "Answered", value: voiceCalls.filter((c) => c.outcome === "Answered").length, color: "text-green-600" },
            { label: "No Answer", value: voiceCalls.filter((c) => c.outcome === "No Answer").length, color: "text-gray-500" },
            { label: "Escalated", value: voiceCalls.filter((c) => c.outcome === "Escalated").length, color: "text-orange-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5 items-start">
          {/* Call Log — FR-13 */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Outbound Call Log</h2>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">FR-13</span>
            </div>
            <div className="divide-y divide-gray-50">
              {voiceCalls.map((call) => {
                const OutcomeIcon = OUTCOME_ICONS[call.outcome] || Phone;
                const isOpen = expanded === call.id;
                return (
                  <div key={call.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Outcome icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${call.outcome === "Answered" ? "bg-green-50" : call.outcome === "No Answer" ? "bg-gray-100" : "bg-orange-50"}`}>
                        <OutcomeIcon size={15} className={call.outcome === "Answered" ? "text-green-600" : call.outcome === "No Answer" ? "text-gray-400" : "text-orange-600"} />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">{call.recipient}</span>
                          <span className="text-xs font-mono text-gray-400">{call.phone}</span>
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">{call.incidentId}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{call.ts}</span>
                          {call.duration && <span className="font-mono">{call.duration}</span>}
                          <span className="text-gray-300">·</span>
                          <span>Trigger: {call.trigger}</span>
                        </div>
                      </div>

                      {/* Outcome pill + expand */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${OUTCOME_STYLES[call.outcome]}`}>{call.outcome}</span>
                        <button
                          onClick={() => setExpanded(isOpen ? null : call.id)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100"
                        >
                          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Transcript — expandable */}
                    {isOpen && call.summary && (
                      <div className="mt-3 ml-13 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Call Summary / Transcript</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{call.summary}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Escalation Settings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Settings size={15} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900">Escalation Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Retry Count</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={retryCount}
                    onChange={(e) => setRetryCount(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-sm font-bold text-gray-900 w-4 text-center">{retryCount}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Call will be retried up to {retryCount}× before escalating.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Escalate-To Contact</label>
                <input
                  value={escalateTo}
                  onChange={(e) => setEscalateTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Escalation Threshold</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="HIGH">HIGH &amp; above</option>
                  <option value="CRITICAL">CRITICAL only</option>
                  <option value="ALL">All severities</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Call Window</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">From</p>
                    <input type="time" defaultValue="08:00" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-gray-50" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">To</p>
                    <input type="time" defaultValue="22:00" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-gray-50" />
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
