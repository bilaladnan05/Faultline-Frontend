import { useState } from "react";
import { Lock, Shield, ChevronDown, Filter } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { ledgerEntries } from "../mocks/ledger";

const TYPE_STYLES = {
  detection: "bg-red-50 text-red-700 border border-red-200",
  inference: "bg-purple-50 text-purple-700 border border-purple-200",
  approval: "bg-blue-50 text-blue-700 border border-blue-200",
  remediation: "bg-green-50 text-green-700 border border-green-200",
  escalation: "bg-orange-50 text-orange-700 border border-orange-200",
  closure: "bg-gray-100 text-gray-600 border border-gray-200",
};

const ROLE_COLORS = {
  "AI Agent": "bg-purple-50 text-purple-700",
  "AI Model": "bg-purple-50 text-purple-700",
  "Autonomous": "bg-purple-50 text-purple-700",
  "System": "bg-gray-100 text-gray-600",
  "Admin": "bg-red-50 text-red-700",
  "Senior Engineer": "bg-blue-50 text-blue-700",
  "SRE Lead": "bg-indigo-50 text-indigo-700",
  "SRE": "bg-indigo-50 text-indigo-700",
  "DevOps Engineer": "bg-teal-50 text-teal-700",
  "Product Manager": "bg-orange-50 text-orange-700",
};

export default function LedgerPage() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [incFilter, setIncFilter] = useState("All");

  const types = ["All", ...Array.from(new Set(ledgerEntries.map((e) => e.type)))];
  const incidents = ["All", ...Array.from(new Set(ledgerEntries.map((e) => e.incidentId)))];

  const filtered = ledgerEntries.filter((e) => {
    const tOk = typeFilter === "All" || e.type === typeFilter;
    const iOk = incFilter === "All" || e.incidentId === incFilter;
    return tOk && iOk;
  });

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Incident Ledger"]} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Lock size={18} className="text-gray-600" />
              Immutable Incident Ledger
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tamper-proof, chronological log of all system events, AI inferences, and human actions.{" "}
              <span className="font-semibold text-blue-600">FR-11 · FR-14</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
            <Lock size={11} />
            IMMUTABLE — READ ONLY
          </div>
        </div>

        {/* Non-repudiation notice — FR-14 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <Shield size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900">Non-Repudiation Guarantee · FR-14</p>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
              Every entry is cryptographically signed with the acting principal's identity and role. Entries cannot be edited, reordered, or deleted. Actor identity is captured for both human operators and AI agents.
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Entries", value: ledgerEntries.length, color: "text-gray-900" },
            { label: "AI Actions", value: ledgerEntries.filter((e) => e.actorRole === "AI Agent").length, color: "text-purple-600" },
            { label: "Human Actions", value: ledgerEntries.filter((e) => e.actorRole !== "AI Agent" && e.actorRole !== "System").length, color: "text-blue-600" },
            { label: "Incidents Covered", value: new Set(ledgerEntries.map((e) => e.incidentId)).size, color: "text-gray-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Filter size={11} /> Filter</span>
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={types} />
          <FilterSelect label="Incident" value={incFilter} onChange={setIncFilter} options={incidents} />
          <span className="ml-auto text-xs text-gray-400">{filtered.length} entries</span>
        </div>

        {/* Ledger Timeline */}
        <div className="space-y-3">
          {filtered.map((entry, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-blue-200 mt-1" />
                {i < filtered.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 min-h-6" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${TYPE_STYLES[entry.type]}`}>{entry.type}</span>
                    <span className="text-xs font-bold text-gray-400 font-mono">{entry.incidentId}</span>
                    {entry.severity && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${entry.severity.toUpperCase() === "CRITICAL" ? "bg-red-50 text-red-600 border-red-200" : entry.severity.toUpperCase() === "HIGH" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                        {entry.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Lock size={10} className="text-gray-300" />
                    <span className="text-[10px] text-gray-400 font-mono">{entry.ts}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-800 font-medium leading-relaxed mb-2">{entry.action}</p>

                {entry.outcome && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{entry.outcome}</p>
                )}

                {/* Actor identity — FR-14 */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <Avatar initials={entry.actor.split(" ").map((w) => w[0]).join("").slice(0, 2)} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-gray-700">{entry.actor}</span>
                    <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[entry.actorRole] || "bg-gray-100 text-gray-500"}`}>
                      {entry.actorRole}
                    </span>
                  </div>
                  {entry.immutable && (
                    <span className="ml-auto text-[10px] text-gray-300 font-bold flex items-center gap-0.5">
                      <Lock size={9} /> immutable
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
      <span className="font-medium text-gray-500">{label}:</span>
      <span className="text-blue-600 font-semibold">{value}</span>
      <ChevronDown size={12} className="text-gray-400" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
