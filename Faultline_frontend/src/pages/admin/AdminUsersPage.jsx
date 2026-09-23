import { useCallback, useMemo, useState } from "react";
import {
  Users as UsersIcon, Plus, RefreshCw, X, Check, Shield, FolderPlus, UserX, UserCheck,
} from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../../components/ui/AsyncState";
import { showToast } from "../../components/ui/Toast";
import { useApiResource } from "../../hooks/useApiResource";
import {
  assignProject, createUser, listProjects, listUsers, unassignProject, updateUser,
} from "../../api/endpoints";
import { ROLES, ROLE_STYLES, roleLabel } from "../../auth/roles";
import { useAuth } from "../../auth/AuthContext";

/**
 * User management, and with it project assignment.
 *
 * Assignment is edited here rather than on a separate permissions screen because
 * `project_users` is the only thing that grants an Onsite Engineer access to anything —
 * there is no second place to configure it, and this page is the one place to see it.
 *
 * Every action here is refused by the API for anyone but an Admin, so this page failing
 * to render for an engineer is a convenience, not the control.
 */
export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const users = useApiResource(({ signal }) => listUsers({ signal }), []);
  const projects = useApiResource(({ signal }) => listProjects({ signal }), []);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(null);

  // Memoised because `projectName` depends on it: a fresh [] on every render would
  // rebuild that lookup each time for no reason.
  const projectList = useMemo(() => projects.data ?? [], [projects.data]);
  const items = users.data?.items ?? [];

  const projectName = useMemo(() => {
    const names = new Map(projectList.map((p) => [p.id, p.name]));
    return (id) => names.get(id) ?? id;
  }, [projectList]);

  /** Wraps a mutation so every one reports the API's own refusal rather than guessing. */
  const act = useCallback(
    async (key, work, successMessage) => {
      setBusy(key);
      try {
        await work();
        showToast(successMessage);
        await users.refetch();
      } catch (error) {
        showToast(
          error?.isForbidden
            ? "The API refused this: your role does not permit it."
            : error?.message || "That did not work.",
        );
      } finally {
        setBusy(null);
      }
    },
    [users],
  );

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Administration", "Users"]}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { users.refetch(); projects.refetch(); }}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={users.refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> New user
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users &amp; project access</h1>
          <p className="text-sm text-gray-500 mt-1">
            Project assignment is the single source of truth for what an Onsite Engineer
            can reach. Removing an assignment takes effect on their very next request —
            they do not need to sign out.
          </p>
        </div>

        <StaleBanner error={users.data ? users.error : null} onRetry={users.refetch} />

        {creating && (
          <NewUserForm
            projects={projectList}
            onCancel={() => setCreating(false)}
            onCreate={async (payload) => {
              await act("create", () => createUser(payload), `Created ${payload.email}.`);
              setCreating(false);
            }}
            busy={busy === "create"}
          />
        )}

        <AsyncSection
          loading={users.loading}
          error={users.error}
          data={users.data}
          onRetry={users.refetch}
          loadingLabel="Loading users…"
          isEmpty={() => items.length === 0}
          emptyIcon={UsersIcon}
          emptyTitle="No users yet"
          emptyHint="Create the first user with the button above, or from the backend with npm run user:create."
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Projects</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((entry) => (
                  <UserRow
                    key={entry.id}
                    user={entry}
                    isSelf={entry.id === currentUser?.id}
                    projects={projectList}
                    projectName={projectName}
                    busy={busy}
                    act={act}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </AsyncSection>

        <p className="text-xs text-gray-400">
          An Admin reaches every project by role, so administrators are shown as “All
          projects” rather than being listed against individual ones.
        </p>
      </div>
    </div>
  );
}

function UserRow({ user, isSelf, projects, projectName, busy, act }) {
  const [adding, setAdding] = useState(false);
  const isAdminRow = user.role === ROLES.ADMIN;
  const assigned = user.projectIds ?? [];
  const unassigned = projects.filter((project) => !assigned.includes(project.id));

  return (
    <tr className="hover:bg-gray-50/60">
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </td>

      <td className="px-4 py-3">
        <select
          value={user.role}
          disabled={isSelf || busy === user.id}
          title={isSelf ? "You cannot change your own role" : undefined}
          onChange={(event) =>
            act(user.id, () => updateUser(user.id, { role: event.target.value }),
              `${user.email} is now ${roleLabel(event.target.value)}.`)
          }
          className={`text-xs font-semibold px-2.5 py-1 rounded-full disabled:opacity-60 ${ROLE_STYLES[user.role] ?? "border border-gray-200"}`}
        >
          {Object.values(ROLES).map((role) => (
            <option key={role} value={role}>{roleLabel(role)}</option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        {isAdminRow ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Shield size={12} /> All projects
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {assigned.map((projectId) => (
              <span
                key={projectId}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full"
              >
                {projectName(projectId)}
                <button
                  type="button"
                  title="Remove assignment"
                  disabled={busy === user.id}
                  onClick={() =>
                    act(user.id, () => unassignProject(user.id, projectId),
                      `Removed ${user.email} from ${projectName(projectId)}.`)
                  }
                  className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {!assigned.length && (
              <span className="text-xs text-gray-400">No projects — sees nothing</span>
            )}
            {adding ? (
              <select
                autoFocus
                defaultValue=""
                disabled={busy === user.id}
                onChange={async (event) => {
                  const projectId = event.target.value;
                  if (!projectId) return setAdding(false);
                  await act(user.id, () => assignProject(user.id, projectId),
                    `Assigned ${user.email} to ${projectName(projectId)}.`);
                  setAdding(false);
                }}
                onBlur={() => setAdding(false)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
              >
                <option value="">Select a project…</option>
                {unassigned.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            ) : (
              unassigned.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <FolderPlus size={12} /> Assign
                </button>
              )
            )}
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            user.status === "active"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}
        >
          {user.status}
        </span>
      </td>

      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled={isSelf || busy === user.id}
          title={isSelf ? "You cannot disable your own account" : undefined}
          onClick={() =>
            act(user.id,
              () => updateUser(user.id, { status: user.status === "active" ? "disabled" : "active" }),
              `${user.email} is now ${user.status === "active" ? "disabled" : "active"}.`)
          }
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40"
        >
          {user.status === "active" ? <><UserX size={13} /> Disable</> : <><UserCheck size={13} /> Enable</>}
        </button>
      </td>
    </tr>
  );
}

function NewUserForm({ projects, onCancel, onCreate, busy }) {
  const [form, setForm] = useState({
    email: "", name: "", role: ROLES.ONSITE_ENGINEER, password: "", projectIds: [],
  });
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const toggleProject = (projectId) =>
    setForm((prev) => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId],
    }));

  const valid = form.email.includes("@") && form.name.trim() && form.password.length >= 12;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onCreate(form);
      }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">New user</h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full name">
          <input value={form.name} onChange={set("name")} placeholder="Ahmed Khan" className={inputClass} />
        </Field>
        <Field label="Email address">
          <input type="email" value={form.email} onChange={set("email")} placeholder="ahmed@company.io" className={inputClass} />
        </Field>
        <Field label="Role">
          <select value={form.role} onChange={set("role")} className={inputClass}>
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>{roleLabel(role)}</option>
            ))}
          </select>
        </Field>
        <Field label="Temporary password" hint="At least 12 characters; the API refuses shorter.">
          <input type="password" value={form.password} onChange={set("password")} className={inputClass} />
        </Field>
      </div>

      {form.role === ROLES.ONSITE_ENGINEER && (
        <Field
          label="Assign projects"
          hint="An engineer with no assignments can sign in but sees nothing, so assign at least one."
        >
          <div className="flex flex-wrap gap-2 pt-1">
            {projects.length === 0 && (
              <span className="text-xs text-gray-400">No projects exist yet.</span>
            )}
            {projects.map((project) => {
              const selected = form.projectIds.includes(project.id);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => toggleProject(project.id)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                    selected
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {selected && <Check size={12} />}
                  {project.name}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={!valid || busy}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create user"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400";

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
