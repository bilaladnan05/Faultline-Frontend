import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, ShieldAlert, Boxes, LoaderCircle, Trash2 } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import UninstallClusterDialog from "../components/clusters/UninstallClusterDialog";
import { useApiResource } from "../hooks/useApiResource";
import {
  getClusterOnboarding,
  listClusters,
  startClusterUninstall,
} from "../api/endpoints";
import { formatAge } from "../api/adapters";
import { useProject } from "../context/useProject";
import { useAuth } from "../auth/AuthContext";
import { clusterLimit } from "../auth/plans";

const STATUS_STYLE = {
  connected: { label: "Healthy", dot: "bg-green-500", text: "text-green-600", border: "border-l-green-500" },
  degraded: { label: "Open incidents", dot: "bg-yellow-500", text: "text-yellow-700", border: "border-l-yellow-500" },
  disconnected: { label: "Unknown", dot: "bg-gray-400", text: "text-gray-500", border: "border-l-gray-400" },
};

export default function DeploymentsPage() {
  const navigate = useNavigate();
  const { setActiveProject } = useProject();
  const { isAdmin, entitlements } = useAuth();
  const limit = clusterLimit(entitlements);
  const [uninstallJob, setUninstallJob] = useState(null);
  const [uninstallingClusterId, setUninstallingClusterId] = useState(null);
  const [uninstallError, setUninstallError] = useState("");
  const [confirmingUninstall, setConfirmingUninstall] = useState(null);

  const registered = useApiResource(({ signal }) => listClusters({ signal }), []);
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

  const cancelUninstall = useCallback(() => setConfirmingUninstall(null), []);

  // Only reached from UninstallClusterDialog, after the admin has typed the cluster name.
  const uninstall = useCallback(async (cluster) => {
    setConfirmingUninstall(null);
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

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Clusters"]}
        action={
          <button
            type="button"
            onClick={registered.refetch}
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
          {limit !== null && registered.data && (
            <p className="text-xs font-semibold text-gray-500 mt-2">
              {entitlements.planName} plan: {clusters.length} of {limit} cluster{limit === 1 ? "" : "s"} used.
              {clusters.length >= limit && " Upgrade to Pro to connect more."}
            </p>
          )}
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
                      onClick={() => open(cluster, "/ledger")}
                      className="flex-1 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold py-1.5 rounded-lg"
                    >
                      Manage
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setConfirmingUninstall(cluster)}
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

      {confirmingUninstall && (
        <UninstallClusterDialog
          key={confirmingUninstall.clusterId}
          cluster={confirmingUninstall}
          onCancel={cancelUninstall}
          onConfirm={uninstall}
        />
      )}
    </div>
  );
}
