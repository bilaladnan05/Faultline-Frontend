import { useState } from "react";
import { ScrollText, RefreshCw, ShieldAlert, Lock } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../../components/ui/AsyncState";
import { useApiResource } from "../../hooks/useApiResource";
import { listAuditLog } from "../../api/endpoints";

/**
 * The audit trail, read-only.
 *
 * There is no edit or delete control on this page because there is no endpoint behind
 * one: the API exposes reads only, and the table itself refuses UPDATE and DELETE (see
 * migration 0005). An Admin can read the trail and nothing more, which is the point of
 * keeping one.
 */

const ACTION_GROUPS = [
  { value: "", label: "All activity" },
  { value: "auth.login.succeeded", label: "Sign-ins" },
  { value: "auth.login.failed", label: "Failed sign-ins" },
  { value: "access.denied", label: "Refused access attempts" },
  { value: "project.created", label: "Projects created" },
  { value: "project.modified", label: "Projects modified" },
  { value: "project.deleted", label: "Projects deleted" },
  { value: "project.assignment.created", label: "Assignments granted" },
  { value: "project.assignment.removed", label: "Assignments removed" },
  { value: "user.created", label: "Users created" },
  { value: "user.modified", label: "Users modified" },
  { value: "user.role.changed", label: "Role changes" },
];

const ACTION_STYLE = (action, outcome) => {
  if (outcome === "denied") return "bg-red-50 text-red-700 border-red-200";
  if (action.startsWith("project.assignment") || action === "user.role.changed")
    return "bg-purple-50 text-purple-700 border-purple-200";
  if (action.startsWith("project.")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (action.startsWith("user.")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (action.startsWith("auth.")) return "bg-gray-100 text-gray-600 border-gray-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
};

const when = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
};

export default function AdminAuditPage() {
  const [action, setAction] = useState("");
  const [outcome, setOutcome] = useState("");

  // Deps are primitives, as useApiResource requires, so changing a filter refetches.
  const audit = useApiResource(
    ({ signal }) => listAuditLog({ action, outcome, limit: 200 }, { signal }),
    [action, outcome],
  );

  const items = audit.data?.items ?? [];
  const denials = items.filter((entry) => entry.outcome === "denied").length;

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Administration", "Audit Logs"]}
        action={
          <button
            type="button"
            onClick={audit.refetch}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={audit.refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign-ins, project and user changes, permission changes, and every refused
            access attempt. Append-only: these records cannot be edited or deleted
            through the application.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            {ACTION_GROUPS.map((group) => (
              <option key={group.value} value={group.value}>{group.label}</option>
            ))}
          </select>
          <select
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">Any outcome</option>
            <option value="allowed">Allowed</option>
            <option value="denied">Denied</option>
          </select>

          {denials > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              <ShieldAlert size={12} />
              {denials} refused attempt{denials === 1 ? "" : "s"} in this view
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
            <Lock size={12} /> Read-only
          </span>
        </div>

        <StaleBanner error={audit.data ? audit.error : null} onRetry={audit.refetch} />

        <AsyncSection
          loading={audit.loading}
          error={audit.error}
          data={audit.data}
          onRetry={audit.refetch}
          loadingLabel="Loading audit records…"
          isEmpty={() => items.length === 0}
          emptyIcon={ScrollText}
          emptyTitle="No matching activity"
          emptyHint="Records appear as people sign in, change projects and assignments, or are refused access."
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">When</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actor</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/60 align-top">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {when(entry.occurredAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 font-medium">{entry.actor}</p>
                      {entry.ip && <p className="text-xs text-gray-400">{entry.ip}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${ACTION_STYLE(entry.action, entry.outcome)}`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <span className="text-gray-400">{entry.resourceType}</span>
                      {entry.resourceId ? ` · ${entry.resourceId}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                      {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                        <code className="break-all">{JSON.stringify(entry.metadata)}</code>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncSection>
      </div>
    </div>
  );
}
