import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Server, RefreshCw, Boxes, X, Trash2, ShieldCheck } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { showToast } from "../components/ui/Toast";
import { useApiResource } from "../hooks/useApiResource";
import {
  createProject, deleteProject, getReadiness, getSystemInfo, listProjects,
} from "../api/endpoints";
import { formatAge } from "../api/adapters";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../auth/roles";

/**
 * The project list.
 *
 * Previously this guessed at the cluster list by reading every incident and collecting
 * the cluster ids it found — the API had no project registry to ask. It does now, and
 * that registry is scoped by assignment on the server: an Onsite Engineer's request
 * returns only their projects, so this page renders what it is given and filters
 * nothing itself. Two places deciding who sees what is exactly how they drift apart.
 */

const STATUS_STYLE = {
  healthy: { label: "Healthy", dot: "bg-green-500", text: "text-green-600", border: "border-l-green-500" },
  degraded: { label: "Open incidents", dot: "bg-yellow-500", text: "text-yellow-700", border: "border-l-yellow-500" },
  critical: { label: "Critical", dot: "bg-red-500", text: "text-red-600", border: "border-l-red-500" },
};

const statusOf = (project) =>
  project.critical > 0 ? "critical" : project.open > 0 ? "degraded" : "healthy";

export default function DeploymentsPage() {
  const navigate = useNavigate();
  const { setActiveProject } = useProject();
  const { user, can } = useAuth();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const projects = useApiResource(({ signal }) => listProjects({ signal }), []);
  const readiness = useApiResource(({ signal }) => getReadiness({ signal }), []);
  const system = useApiResource(({ signal }) => getSystemInfo({ signal }), []);

  const items = projects.data ?? [];
  const canCreate = can(PERMISSIONS.PROJECT_CREATE);
  const canDelete = can(PERMISSIONS.PROJECT_DELETE);

  const open = useCallback(
    (project, path) => {
      setActiveProject({
        id: project.id,
        clusterId: project.id,
        name: project.name,
        env: project.environment,
        region: project.id,
        namespaces: project.workloadNamespace ? [project.workloadNamespace] : [],
      });
      navigate(path);
    },
    [navigate, setActiveProject],
  );

  const addProject = async (payload) => {
    setBusy(true);
    try {
      await createProject(payload);
      showToast(`Created ${payload.name}.`);
      setCreating(false);
      await projects.refetch();
    } catch (error) {
      showToast(
        error?.isConflict
          ? "A project with that id already exists."
          : error?.message || "Could not create the project.",
      );
    } finally {
      setBusy(false);
    }
  };

  const removeProject = async (project) => {
    // The API refuses to delete a project that still has recorded incidents, so this
    // says what will happen rather than promising something that may be declined.
    if (!window.confirm(`Delete ${project.name}? Its engineer assignments go with it.`))
      return;
    try {
      await deleteProject(project.id);
      showToast(`Deleted ${project.name}.`);
      await projects.refetch();
    } catch (error) {
      showToast(
        error?.isConflict
          ? "This project still has recorded incidents and cannot be deleted."
          : error?.message || "Could not delete the project.",
      );
    }
  };

  const summary = {
    healthy: items.filter((p) => statusOf(p) === "healthy").length,
    degraded: items.filter((p) => statusOf(p) === "degraded").length,
    critical: items.filter((p) => statusOf(p) === "critical").length,
  };

  // A 503 readiness response still carries the dependency report in its body.
  const health = readiness.data ?? readiness.error?.body ?? null;
  const dependencies = health?.dependencies ?? null;
  const readinessStatus = typeof health?.status === "string" ? health.status : "unavailable";

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Projects"]}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { projects.refetch(); readiness.refetch(); }}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={projects.refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={14} /> New project
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {canCreate ? "All projects" : "My projects"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {canCreate
              ? "Every project Faultline monitors. Assign engineers to them from Administration → Users."
              : "The projects an administrator has assigned to you. Select one to open its workspace."}
          </p>
        </div>

        {/* API status — the connection this whole app depends on. */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                <Server size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faultline API</p>
                <p className="text-sm font-semibold text-gray-900">
                  {system.data
                    ? `${system.data.application} v${system.data.version} · ${system.data.environment}`
                    : system.error
                      ? "Unreachable"
                      : "Checking…"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {dependencies &&
                Object.entries(dependencies).map(([name, value]) => {
                  const state = typeof value === "string" ? value : (value?.status ?? "unknown");
                  const healthy = state === "ok" || state === "up" || state === "healthy";
                  return (
                    <span
                      key={name}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        healthy ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${healthy ? "bg-green-500" : "bg-red-500"}`} />
                      {name}
                    </span>
                  );
                })}
              <span
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                  readinessStatus === "ok"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : readinessStatus === "degraded"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-red-50 text-red-600 border-red-200"
                }`}
              >
                {readinessStatus === "ok" ? "Ready" : readinessStatus === "degraded" ? "Degraded" : "Not ready"}
              </span>
            </div>
          </div>
        </div>

        <StaleBanner error={projects.data ? projects.error : null} onRetry={projects.refetch} />

        {creating && (
          <NewProjectForm busy={busy} onCancel={() => setCreating(false)} onCreate={addProject} />
        )}

        <div className="flex items-center gap-4 flex-wrap">
          {["healthy", "degraded", "critical"].map((key) => (
            <div key={key} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[key].dot}`} />
              <span className="text-sm text-gray-700">
                <strong>{summary[key]}</strong> {STATUS_STYLE[key].label}
              </span>
            </div>
          ))}
        </div>

        <AsyncSection
          loading={projects.loading}
          error={projects.error}
          data={projects.data}
          onRetry={projects.refetch}
          loadingLabel="Loading your projects…"
          isEmpty={() => items.length === 0}
          emptyIcon={Boxes}
          emptyTitle={canCreate ? "No projects yet" : "No projects assigned to you"}
          emptyHint={
            canCreate
              ? "Create one with the button above, or onboard a cluster with npm run cluster:onboard."
              : "An administrator has not assigned you to any project yet. Ask them to add you, and it will appear here without needing to sign in again."
          }
        >
          <div className="grid grid-cols-2 gap-4">
            {items.map((project) => {
              const style = STATUS_STYLE[statusOf(project)];
              return (
                <article
                  key={project.id}
                  className={`bg-white rounded-xl border border-gray-200 border-l-4 ${style.border} shadow-sm p-4`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Boxes size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{project.name}</h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {project.environment}
                        {project.workloadNamespace ? ` · ${project.workloadNamespace}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Open</p>
                      <p className={`text-sm font-semibold mt-0.5 ${project.open ? "text-gray-900" : "text-gray-400"}`}>
                        {project.open}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Critical</p>
                      <p className={`text-sm font-semibold mt-0.5 ${project.critical ? "text-red-600" : "text-gray-400"}`}>
                        {project.critical}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last activity</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {project.lastSeen ? `${formatAge(project.lastSeen)} ago` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Only an Admin is told who is assigned; an engineer has no reason to
                      see the roster of another person's access. */}
                  {canCreate && (
                    <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-3">
                      <ShieldCheck size={11} />
                      {project.assignedUserIds?.length
                        ? `${project.assignedUserIds.length} engineer${project.assignedUserIds.length === 1 ? "" : "s"} assigned`
                        : "No engineers assigned yet"}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => open(project, "/runtime")}
                      className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold py-1.5 rounded-lg"
                    >
                      View Logs
                    </button>
                    <button
                      type="button"
                      onClick={() => open(project, "/dashboard")}
                      className="flex-1 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold py-1.5 rounded-lg"
                    >
                      Manage
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        title="Delete project"
                        onClick={() => removeProject(project)}
                        className="px-2.5 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </AsyncSection>

        {!canCreate && items.length > 0 && (
          <p className="text-xs text-gray-400">
            Signed in as {user?.email}. You see {items.length} project
            {items.length === 1 ? "" : "s"} because that is what you are assigned to.
          </p>
        )}
      </div>
    </div>
  );
}

function NewProjectForm({ busy, onCancel, onCreate }) {
  const [form, setForm] = useState({
    id: "", name: "", environment: "production", workloadNamespace: "",
  });
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  // The API applies the same rule; checking here just avoids a pointless round trip.
  const valid = /^[a-z0-9][a-z0-9_-]{0,62}$/i.test(form.id.trim());

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        onCreate({
          id: form.id.trim(),
          name: form.name.trim() || form.id.trim(),
          environment: form.environment,
          ...(form.workloadNamespace.trim()
            ? { workloadNamespace: form.workloadNamespace.trim() }
            : {}),
        });
      }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">New project</h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Project id</label>
          <input
            value={form.id}
            onChange={set("id")}
            placeholder="production-infrastructure"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            This is the cluster id telemetry arrives under. Letters, digits, dash or
            underscore; it cannot be changed later.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="Production Infrastructure"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Environment</label>
          <select
            value={form.environment}
            onChange={set("environment")}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Recorded now; per-environment restrictions are not enforced yet.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Workload namespace <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            value={form.workloadNamespace}
            onChange={set("workloadNamespace")}
            placeholder="default"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!valid || busy}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create project"}
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
