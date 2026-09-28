import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Server, RefreshCw, ShieldAlert, Boxes, LoaderCircle, Trash2, UserRoundCheck } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource } from "../hooks/useApiResource";
import {
  getClusterOnboarding,
  getReadiness,
  getSystemInfo,
  listClusters,
  startClusterUninstall,
  getClusterSres,
  assignClusterSre,
  unassignClusterSre,
} from "../api/endpoints";
import { formatAge } from "../api/adapters";
import { useProject } from "../context/useProject";
import { useAuth } from "../auth/AuthContext";

const STATUS_STYLE = {
  connected: { label: "Healthy", dot: "bg-green-500", text: "text-green-600", border: "border-l-green-500" },
  degraded: { label: "Open incidents", dot: "bg-yellow-500", text: "text-yellow-700", border: "border-l-yellow-500" },
  disconnected: { label: "Unknown", dot: "bg-gray-400", text: "text-gray-500", border: "border-l-gray-400" },
};

export default function DeploymentsPage() {
  const navigate = useNavigate();
  const { setActiveProject } = useProject();
  const { isAdmin } = useAuth();
  const [uninstallJob, setUninstallJob] = useState(null);
  const [uninstallingClusterId, setUninstallingClusterId] = useState(null);
  const [uninstallError, setUninstallError] = useState("");

  const registered = useApiResource(({ signal }) => listClusters({ signal }), []);
  const readiness = useApiResource(({ signal }) => getReadiness({ signal }), []);
  const system = useApiResource(({ signal }) => getSystemInfo({ signal }), []);
  const refetchClusters = registered.refetch;

  useEffect(() => {
    if (!uninstallJob?.id || uninstallJob.status !== "running") return undefined;
    const controller = new AbortController();
    const timer = window.setInterval(async () => {
      try {
        const next = await getClusterOnboarding(uninstallJob.id, {
          signal: controller.signal,
        });
        setUninstallJob(next);
        if (next.status === "succeeded") {
          setUninstallingClusterId(null);
          setUninstallJob(null);
          refetchClusters();
        } else if (next.status === "failed") {
          setUninstallingClusterId(null);
          setUninstallError(next.error || "Cluster uninstall failed.");
        }
      } catch (caught) {
        if (caught?.name !== "AbortError") {
          setUninstallingClusterId(null);
          setUninstallJob(null);
          setUninstallError(caught?.message || "Could not read uninstall progress.");
        }
      }
    }, 1500);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refetchClusters, uninstallJob?.id, uninstallJob?.status]);

  const clusters = useMemo(() => {
    return (registered.data ?? []).map((cluster) => ({
      ...cluster,
      clusterId: cluster.id,
      env: "CLUSTER",
      region: cluster.kubernetesContext ?? cluster.id,
      namespaces: cluster.workloadNamespace ? [cluster.workloadNamespace] : [],
      status: cluster.open > 0 ? "degraded" : "connected",
    }));
  }, [registered.data]);

  const open = useCallback(
    (cluster, path) => {
      setActiveProject({
        id: cluster.clusterId,
        clusterId: cluster.clusterId,
        name: cluster.name,
        env: cluster.env,
        region: cluster.region,
        namespaces: cluster.namespaces ?? [],
      });
      navigate(path);
    },
    [navigate, setActiveProject],
  );

  const uninstall = useCallback(async (cluster) => {
    const confirmed = window.confirm(
      `Uninstall Faultline from ${cluster.name}?\n\nThis removes Faultline collectors and its cluster registration. Your application workloads are not changed.`,
    );
    if (!confirmed) return;

    setUninstallError("");
    setUninstallingClusterId(cluster.clusterId);
    try {
      setUninstallJob(await startClusterUninstall(cluster.clusterId));
    } catch (caught) {
      setUninstallingClusterId(null);
      setUninstallError(caught?.message || "Cluster uninstall could not be started.");
    }
  }, []);

  const summary = {
    connected: clusters.filter((c) => c.status === "connected").length,
    degraded: clusters.filter((c) => c.status === "degraded").length,
  };

  // A 503 readiness response still carries the dependency report in its body.
  const health = readiness.data ?? readiness.error?.body ?? null;
  const dependencies = health?.dependencies ?? null;
  // 'ok' | 'degraded' (non-critical dependency down) | 'unavailable' (503 body).
  const readinessStatus = typeof health?.status === "string" ? health.status : "unavailable";

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Clusters"]}
        action={
          <button
            type="button"
            onClick={() => {
              registered.refetch();
              readiness.refetch();
            }}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={registered.refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monitored Clusters</h1>
          <p className="text-sm text-gray-500 mt-1">
            Clusters explicitly registered by onboarding. Select one to open its monitored workspace.
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

        <StaleBanner error={registered.data ? registered.error : null} onRetry={registered.refetch} />

        {uninstallError && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <ShieldAlert size={15} className="shrink-0" />
            <span className="flex-1">{uninstallError}</span>
            <button type="button" onClick={() => setUninstallError("")} className="text-xs font-bold hover:underline">Dismiss</button>
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          {["connected", "degraded"].map((key) => (
            <div key={key} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[key].dot}`} />
              <span className="text-sm text-gray-700">
                <strong>{summary[key]}</strong> {STATUS_STYLE[key].label}
              </span>
            </div>
          ))}
        </div>

        {isAdmin && clusters.length > 0 && <AssignedSresModule clusters={clusters} />}

        <AsyncSection
          loading={registered.loading}
          error={registered.error}
          data={registered.data}
          onRetry={registered.refetch}
          loadingLabel="Discovering clusters…"
          isEmpty={() => clusters.length === 0}
          emptyIcon={Boxes}
          emptyTitle="No clusters observed yet"
          emptyHint="Run the cluster onboarding command to register a monitored Kubernetes cluster."
        >
          <div className="grid grid-cols-2 gap-4">
            {clusters.map((cluster) => {
              const style = STATUS_STYLE[cluster.status] ?? STATUS_STYLE.disconnected;
              return (
                <article
                  key={cluster.clusterId}
                  className={`bg-white rounded-xl border border-gray-200 border-l-4 ${style.border} shadow-sm p-4`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Boxes size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{cluster.name}</h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {cluster.namespaces.length
                          ? `${cluster.namespaces.length} namespace${cluster.namespaces.length === 1 ? "" : "s"}`
                          : "No namespaces recorded"}
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
                      <p className={`text-sm font-semibold mt-0.5 ${cluster.open ? "text-gray-900" : "text-gray-400"}`}>
                        {cluster.open}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Critical</p>
                      <p
                        className={`text-sm font-semibold mt-0.5 ${cluster.critical ? "text-red-600" : "text-gray-400"}`}
                      >
                        {cluster.critical}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last activity</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {cluster.lastSeen ? `${formatAge(cluster.lastSeen)} ago` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => open(cluster, "/runtime")}
                      className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold py-1.5 rounded-lg"
                    >
                      View Logs
                    </button>
                    <button
                      type="button"
                      onClick={() => open(cluster, "/incidents")}
                      className="flex-1 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold py-1.5 rounded-lg"
                    >
                      Manage
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => uninstall(cluster)}
                        disabled={Boolean(uninstallingClusterId)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uninstallingClusterId === cluster.clusterId ? (
                          <><LoaderCircle size={13} className="animate-spin" /> Uninstalling…</>
                        ) : (
                          <><Trash2 size={13} /> Uninstall</>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </AsyncSection>

        {registered.data && clusters.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldAlert size={12} />
            Cluster identity and monitored namespace come from the onboarding registry.
          </p>
        )}
      </div>
    </div>
  );
}

function AssignedSresModule({ clusters }) {
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const clusterId = selectedClusterId || clusters[0]?.clusterId || "";
  const resource = useApiResource(
    ({ signal }) => clusterId
      ? getClusterSres(clusterId, { signal })
      : Promise.resolve({ items: [] }),
    [clusterId],
  );
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const items = resource.data?.items ?? [];
  const persisted = items.filter((item) => item.assigned).map((item) => item.id);
  const selected = drafts[clusterId] ?? persisted;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const current = new Set(persisted);
      const desired = new Set(selected);
      await Promise.all([
        ...selected.filter((id) => !current.has(id)).map((id) => assignClusterSre(clusterId, id)),
        ...persisted.filter((id) => !desired.has(id)).map((id) => unassignClusterSre(clusterId, id)),
      ]);
      setDrafts((value) => ({ ...value, [clusterId]: [...selected] }));
      setMessage({ type: "success", text: "Assigned SREs updated." });
      await resource.refetch();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not update assigned SREs." });
    } finally {
      setSaving(false);
    }
  };

  return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRoundCheck size={20} /></span>
      <div><h2 className="text-sm font-bold text-gray-900">Assigned SREs</h2><p className="mt-1 text-xs text-gray-500">These engineers receive immediate Retell calls and SMS for incidents on the selected cluster.</p></div>
    </div>
    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] lg:items-end">
      <label className="text-xs font-semibold text-gray-700">Cluster<select value={clusterId} onChange={(event) => { setSelectedClusterId(event.target.value); setMessage(null); }} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{clusters.map((cluster) => <option key={cluster.clusterId} value={cluster.clusterId}>{cluster.name}</option>)}</select></label>
      <label className="text-xs font-semibold text-gray-700">Onsite Engineers<select multiple value={selected} disabled={resource.loading || saving} onChange={(event) => setDrafts((value) => ({ ...value, [clusterId]: [...event.target.selectedOptions].map((option) => option.value) }))} className="mt-1 min-h-28 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100">{items.map((item) => <option key={item.id} value={item.id} disabled={item.status !== "active" && !item.assigned}>{item.name} · {item.email}{!item.phoneConfigured ? " · no phone contact" : !item.voiceEnabled ? " · voice disabled" : ""}{item.status !== "active" ? " · disabled" : ""}</option>)}</select></label>
      <button type="button" onClick={save} disabled={resource.loading || saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <UserRoundCheck size={15} />}{saving ? "Saving…" : "Save assignments"}</button>
    </div>
    {resource.loading && <p className="mt-3 text-xs text-gray-500">Loading Onsite Engineers…</p>}
    {resource.error && <p className="mt-3 text-sm text-red-600">{resource.error.message}</p>}
    {!resource.loading && !resource.error && !items.length && <p className="mt-3 text-sm text-amber-700">No Onsite Engineer accounts exist yet. Create them from Administration → Users.</p>}
    {message && <p className={`mt-3 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
    <p className="mt-3 text-xs text-gray-500">Hold Ctrl (Windows) or Command (macOS) to select multiple engineers. User project access remains managed separately under Administration → Users.</p>
  </section>;
}
