import { useEffect, useState } from "react";
import {
  Eye,
  Filter,
  Lock,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  X,
} from "lucide-react";
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
  { value: "auth.logout", label: "Sign-outs" },
  { value: "auth.mfa.challenge.failed", label: "Failed MFA challenges" },
  { value: "auth.mfa.enrollment.started", label: "MFA enrollment started" },
  { value: "auth.mfa.enabled", label: "MFA enabled" },
  { value: "auth.mfa.disabled", label: "MFA disabled" },
  {
    value: "auth.mfa.recovery-codes.regenerated",
    label: "MFA recovery codes regenerated",
  },
  { value: "auth.password-reset.requested", label: "Password reset requested" },
  { value: "auth.password-reset.completed", label: "Password reset completed" },
  { value: "auth.password-reset.failed", label: "Password reset failed" },
  { value: "user.activity", label: "All authenticated API activity" },
  { value: "access.denied", label: "Refused access attempts" },
  { value: "project.created", label: "Projects created" },
  { value: "project.modified", label: "Projects modified" },
  { value: "project.deleted", label: "Projects deleted" },
  { value: "project.assignment.created", label: "Assignments granted" },
  { value: "project.assignment.removed", label: "Assignments removed" },
  { value: "user.created", label: "Users created" },
  { value: "user.modified", label: "Users modified" },
  { value: "user.role.changed", label: "Role changes" },
  { value: "user.status.changed", label: "User status changes" },
  { value: "user.password.changed", label: "Password changes" },
  { value: "user.mfa.reset", label: "MFA resets" },
  { value: "cluster.sre.assigned", label: "Cluster SRE assigned" },
  { value: "cluster.sre.removed", label: "Cluster SRE removed" },
  { value: "incident.acknowledged", label: "Incident acknowledgements" },
  {
    value: "incident.external-ticket.slack.requested",
    label: "Slack ticket requests",
  },
  { value: "remediation.approved", label: "Remediation approved" },
  { value: "remediation.overridden", label: "Remediation overridden" },
  { value: "remediation.executed", label: "Remediation executed" },
  { value: "subscription.purchased", label: "Subscriptions purchased" },
  { value: "subscription.provisioned", label: "Subscriptions provisioned" },
  {
    value: "subscription.provisioning.failed",
    label: "Subscription provisioning failures",
  },
];

const EMPTY_FILTERS = {
  userId: "",
  action: "",
  resourceType: "",
  resourceId: "",
  outcome: "",
  since: "",
  until: "",
  limit: "200",
};

const ACTION_STYLE = (action, outcome) => {
  if (outcome === "denied") return "bg-red-50 text-red-700 border-red-200";
  if (action.startsWith("project.assignment") || action === "user.role.changed")
    return "bg-purple-50 text-purple-700 border-purple-200";
  if (action.startsWith("project.")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (action.startsWith("incident."))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (action.startsWith("user.")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (action.startsWith("auth.")) return "bg-gray-100 text-gray-600 border-gray-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
};

const when = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
};

const queryFilters = (filters) => ({
  ...filters,
  since: filters.since ? new Date(filters.since).toISOString() : "",
  until: filters.until ? new Date(filters.until).toISOString() : "",
  limit: Number(filters.limit),
});

const fieldClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

export default function AdminAuditPage() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selected, setSelected] = useState(null);

  const setFilter = (name) => (event) =>
    setDraft((current) => ({ ...current, [name]: event.target.value }));
  const invalidRange =
    draft.since && draft.until && new Date(draft.since) > new Date(draft.until);

  // Deps are primitives, as useApiResource requires, so changing a filter refetches.
  const audit = useApiResource(
    ({ signal }) => listAuditLog(queryFilters(filters), { signal }),
    Object.values(filters),
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
            Sign-ins, project and user changes, incident actions, permission changes,
            and every refused access attempt. Append-only: these records cannot be
            edited or deleted through the application.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (invalidRange) return;
            setSelected(null);
            setFilters({ ...draft });
          }}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Filter size={15} className="text-gray-400" /> Filters
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Lock size={12} /> Read-only
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="Action">
              <select value={draft.action} onChange={setFilter("action")} className={fieldClass}>
                {ACTION_GROUPS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Outcome">
              <select value={draft.outcome} onChange={setFilter("outcome")} className={fieldClass}>
                <option value="">Any outcome</option>
                <option value="allowed">Allowed</option>
                <option value="denied">Denied</option>
              </select>
            </FilterField>
            <FilterField label="User ID">
              <input value={draft.userId} onChange={setFilter("userId")} placeholder="User UUID" className={fieldClass} />
            </FilterField>
            <FilterField label="Resource type">
              <input value={draft.resourceType} onChange={setFilter("resourceType")} placeholder="user, project, incident…" className={fieldClass} />
            </FilterField>
            <FilterField label="Resource ID">
              <input value={draft.resourceId} onChange={setFilter("resourceId")} placeholder="Exact resource ID" className={fieldClass} />
            </FilterField>
            <FilterField label="From">
              <input type="datetime-local" value={draft.since} onChange={setFilter("since")} className={fieldClass} />
            </FilterField>
            <FilterField label="Until">
              <input type="datetime-local" value={draft.until} onChange={setFilter("until")} className={fieldClass} />
            </FilterField>
            <FilterField label="Maximum records">
              <select value={draft.limit} onChange={setFilter("limit")} className={fieldClass}>
                {[50, 100, 200, 500, 1000].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </FilterField>
          </div>
          {invalidRange && (
            <p className="mt-2 text-xs font-medium text-red-600">
              The start date must be before the end date.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={invalidRange}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setDraft(EMPTY_FILTERS);
                setFilters(EMPTY_FILTERS);
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
            {denials > 0 && (
              <span className="ml-auto flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                <ShieldAlert size={12} />
                {denials} refused attempt{denials === 1 ? "" : "s"} in this view
              </span>
            )}
          </div>
        </form>

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
          emptyHint="Records appear as people sign in, manage users and projects, act on incidents, or are refused access."
        >
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">When</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actor</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Record</th>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(entry)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-blue-600 hover:text-blue-800"
                        aria-label={`View details for ${entry.action}`}
                      >
                        <Eye size={13} /> View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncSection>
      </div>
      {selected && (
        <AuditDetailDialog entry={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-gray-600">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function AuditDetailDialog({ entry, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const details = [
    ["Audit ID", entry.id],
    ["Organization ID", entry.organizationId],
    ["User ID", entry.userId],
    ["Actor", entry.actor],
    ["Occurred", when(entry.occurredAt)],
    ["Outcome", entry.outcome],
    ["Action", entry.action],
    ["Resource type", entry.resourceType],
    ["Resource ID", entry.resourceId],
    ["IP address", entry.ip],
    ["User agent", entry.userAgent],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Audit record</p>
            <h2 id="audit-detail-title" className="mt-1 text-lg font-bold text-gray-900">
              {entry.action}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit details"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </header>
        <div className="space-y-5 p-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className={label === "User agent" ? "sm:col-span-2" : ""}>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
                <dd className="mt-1 break-all text-sm text-gray-800">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Metadata</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-700">
              {JSON.stringify(entry.metadata ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
