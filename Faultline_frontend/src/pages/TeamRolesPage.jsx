import { useState } from "react";
import { Users, Shield, Clock, ChevronDown } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { showToast } from "../utils/toast";
import { users, nonRepudiationLog } from "../mocks/users";

const ROLE_STYLES = {
  Admin: "bg-red-50 text-red-700 border border-red-200",
  "Senior Engineer": "bg-blue-50 text-blue-700 border border-blue-200",
  "DevOps Engineer": "bg-teal-50 text-teal-700 border border-teal-200",
  "SRE Lead": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "Product Manager": "bg-orange-50 text-orange-700 border border-orange-200",
};

const ARBAC_STYLES = {
  Autonomous: "bg-purple-50 text-purple-700 border border-purple-200",
  Suggestive: "bg-blue-50 text-blue-700 border border-blue-200",
  "Read-Only": "bg-gray-100 text-gray-600 border border-gray-200",
};

const NR_TYPE_STYLES = {
  detection: "bg-red-50 text-red-600",
  inference: "bg-purple-50 text-purple-600",
  approval: "bg-blue-50 text-blue-600",
  remediation: "bg-green-50 text-green-600",
  closure: "bg-gray-100 text-gray-500",
};

export default function TeamRolesPage() {
  const [activeTab, setActiveTab] = useState("members");
  const [agenticRoles, setAgenticRoles] = useState(
    Object.fromEntries(users.map((u) => [u.id, u.agenticRole]))
  );

  const handleRoleChange = (userId, role) => {
    setAgenticRoles((prev) => ({ ...prev, [userId]: role }));
    showToast(`Agentic role updated to ${role}.`);
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Team & Roles"]}
        action={
          <button
            onClick={() => showToast("Invite member flow opened.")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg"
          >
            <Users size={14} /> Invite Member
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team &amp; Roles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage team access, MFA status (FR-04), Agentic Role-Based Access Control (ARBAC), and non-repudiation log (FR-14).
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: "members", label: "Team Members", icon: Users },
            { key: "log", label: "Non-Repudiation Log", icon: Shield },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              <t.icon size={14} /> {t.label}
              {t.key === "log" && (
                <span className="text-[9px] font-bold bg-blue-50 border border-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full ml-1">FR-14</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "members" && (
          <div className="space-y-4">
            {/* MFA notice — FR-04 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center gap-3">
              <Shield size={16} className="text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                <span className="font-bold">FR-04 · MFA Enforcement:</span> All team members with access to production incidents must have MFA enabled. Members without MFA are flagged below.
              </p>
            </div>

            {/* Member table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["MEMBER", "ROLE", "MFA STATUS", "AGENTIC ROLE (ARBAC)", "LAST ACTIVE"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar initials={user.initials} color={user.color} size="sm" />
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ROLE_STYLES[user.role] || "bg-gray-100 text-gray-500"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.mfaEnabled ? "bg-green-500" : "bg-red-400"}`} />
                          <span className={`text-xs font-bold ${user.mfaEnabled ? "text-green-600" : "text-red-500"}`}>
                            {user.mfaEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative inline-flex items-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border mr-1 ${ARBAC_STYLES[agenticRoles[user.id]] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                            {agenticRoles[user.id]}
                          </span>
                          <ChevronDown size={11} className="text-gray-400" />
                          <select
                            value={agenticRoles[user.id]}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          >
                            {["Read-Only", "Suggestive", "Autonomous"].map((r) => <option key={r}>{r}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock size={11} className="text-gray-300" />
                          {user.lastActive}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ARBAC explanation */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Agentic Role Definitions (ARBAC)</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { role: "Read-Only", desc: "Agent can observe incidents and logs. Cannot trigger any automated actions or remediation.", color: "border-gray-200" },
                  { role: "Suggestive", desc: "Agent can propose fixes and draft PRs. All actions require human approval before execution.", color: "border-blue-200" },
                  { role: "Autonomous", desc: "Agent can detect, analyze, remediate, and close incidents without per-action human approval.", color: "border-purple-200" },
                ].map((item) => (
                  <div key={item.role} className={`bg-gray-50 border ${item.color} rounded-lg p-4`}>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border mb-2 inline-block ${ARBAC_STYLES[item.role]}`}>{item.role}</span>
                    <p className="text-xs text-gray-600 leading-relaxed mt-2">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "log" && (
          <div className="space-y-3">
            {/* FR-14 header */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center gap-3">
              <Shield size={16} className="text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                <span className="font-bold">FR-14 · Non-Repudiation:</span> Every action is permanently logged with the actor's identity, role, timestamp, and incident context. Entries are immutable.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["TIMESTAMP", "ACTOR / ROLE", "ACTION TYPE", "INCIDENT", "ACTION"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nonRepudiationLog.map((entry, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{entry.ts}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar initials={entry.actor.split(" ").map((w) => w[0]).join("").slice(0, 2)} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">{entry.actor}</p>
                            <p className="text-[10px] text-gray-400">{entry.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${NR_TYPE_STYLES[entry.type] || "bg-gray-50 text-gray-500"}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-gray-500">{entry.incidentId}</td>
                      <td className="px-5 py-3 text-xs text-gray-700 max-w-xs">{entry.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
