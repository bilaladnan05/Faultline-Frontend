import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Server, RefreshCw, ShieldAlert, Boxes } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource } from "../hooks/useApiResource";
import { getReadiness, getSystemInfo, listIncidents } from "../api/endpoints";
import { clustersFromIncidents, formatAge } from "../api/adapters";
import { useProject } from "../context/ProjectContext";

const STATUS_STYLE = {
  connected: { label: "Healthy", dot: "bg-green-500", text: "text-green-600", border: "border-l-green-500" },
  degraded: { label: "Open incidents", dot: "bg-yellow-500", text: "text-yellow-700", border: "border-l-yellow-500" },
  disconnected: { label: "Unknown", dot: "bg-gray-400", text: "text-gray-500", border: "border-l-gray-400" },
};

/** Clusters added by ID persist locally: the API has no cluster registry to write to. */
const PINNED_KEY = "fl_pinned_clusters";

function readPinned() {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function DeploymentsPage() {
  const navigate = useNavigate();
  const { setActiveProject } = useProject();
  const [pinned, setPinned] = useState(readPinned);
  const [newCluster, setNewCluster] = useState("");

  // Every incident, unfiltered: the cluster list is derived from what they reference.
  const incidents = useApiResource(({ signal }) => listIncidents({}, { signal }), []);
  const readiness = useApiResource(({ signal }) => getReadiness({ signal }), []);
  const system = useApiResource(({ signal }) => getSystemInfo({ signal }), []);

  const clusters = useMemo(() => {
    const discovered = clustersFromIncidents(incidents.data ?? []);
    const known = new Set(discovered.map((cluster) => cluster.clusterId));
    const extra = pinned
      .filter((id) => !known.has(id))
      .map((id) => ({
        id,
        clusterId: id,
        name: id,
        env: "CLUSTER",
        region: id,
        namespaces: [],
        total: 0,
        open: 0,
        critical: 0,
        lastSeen: null,
        status: "connected",
        pinned: true,
      }));
    return [...discovered, ...extra];
  }, [incidents.data, pinned]);

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

  const addCluster = (event) => {
    event.preventDefault();
    const id = newCluster.trim();
    if (!id) return;
    const next = [...new Set([...pinned, id])];
    setPinned(next);
    localStorage.setItem(PINNED_KEY, JSON.stringify(next));
    setNewCluster("");
  };

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
        breadcrumbs={["Deployments"]}
        action={
          <button
            type="button"
            onClick={() => {
              incidents.refetch();
              readiness.refetch();
            }}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={incidents.refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monitored Clusters</h1>
          <p className="text-sm text-gray-500 mt-1">
            Clusters Faultline has observed, discovered from the incidents the API has recorded. Select one to open its
            workspace.
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

        <StaleBanner error={incidents.data ? incidents.error : null} onRetry={incidents.refetch} />

        <div className="flex items-center gap-4 flex-wrap">
          {["connected", "degraded"].map((key) => (
            <div key={key} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[key].dot}`} />
              <span className="text-sm text-gray-700">
                <strong>{summary[key]}</strong> {STATUS_STYLE[key].label}
              </span>
            </div>
          ))}
          <form onSubmit={addCluster} className="ml-auto flex items-center gap-2">
            <input
              value={newCluster}
              onChange={(event) => setNewCluster(event.target.value)}
              placeholder="Open a cluster by ID…"
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </form>
        </div>

        <AsyncSection
          loading={incidents.loading}
          error={incidents.error}
          data={incidents.data}
          onRetry={incidents.refetch}
          loadingLabel="Discovering clusters…"
          isEmpty={() => clusters.length === 0}
          emptyIcon={Boxes}
          emptyTitle="No clusters observed yet"
          emptyHint="Faultline derives this list from recorded incidents. Once telemetry is ingested and an incident is opened, its cluster appears here — or open a cluster directly by entering its ID above."
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
                      onClick={() => open(cluster, "/dashboard")}
                      className="flex-1 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold py-1.5 rounded-lg"
                    >
                      Manage
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </AsyncSection>

        {incidents.data && clusters.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldAlert size={12} />
            Cluster list is derived from recorded incidents; the API exposes no cluster registry.
          </p>
        )}
      </div>
    </div>
  );
}
