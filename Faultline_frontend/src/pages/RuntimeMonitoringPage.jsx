import { Pause, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { adaptKubernetesEvent, adaptLogRecord } from "../api/adapters";
import {
  listClusters,
  LOG_SEVERITIES,
  queryMetrics,
  searchKubernetesEvents,
  searchLogs,
  TIMELINE_METRIC_NAMES,
} from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import RuntimeMetricChart from "../components/runtime/RuntimeMetricChart";
import TelemetryLogSection from "../components/runtime/TelemetryLogSection";
import {
  applicationOptions,
  matchesRuntimeSearch,
  splitRuntimeTelemetry,
} from "../components/runtime/runtimeTelemetry";
import { StaleBanner } from "../components/ui/AsyncState";
import { livePollMs, useApiResource } from "../hooks/useApiResource";

const WINDOW_MS = 60 * 60 * 1000;
const METRIC_BUCKET_MS = 5 * 60 * 1000;

function runtimeWindow() {
  const end = new Date();
  return {
    startTime: new Date(end.getTime() - WINDOW_MS).toISOString(),
    endTime: end.toISOString(),
  };
}

export default function RuntimeMonitoringPage() {
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("");
  const [requestedApplication, setRequestedApplication] = useState("");
  const clusters = useApiResource(({ signal }) => listClusters({ signal }), []);
  const clusterId = selectedCluster || clusters.data?.[0]?.id || "";

  const logsQuery = useApiResource(
    ({ signal }) => searchLogs({ clusterId, ...runtimeWindow(), severity, limit: 500 }, { signal }),
    [clusterId, severity],
    { enabled: Boolean(clusterId), pollMs: livePollMs, paused },
  );
  const eventsQuery = useApiResource(
    ({ signal }) => searchKubernetesEvents({ clusterId, ...runtimeWindow(), limit: 250 }, { signal }),
    [clusterId],
    { enabled: Boolean(clusterId), pollMs: livePollMs, paused },
  );
  const metricsQuery = useApiResource(
    async ({ signal }) => {
      const window = runtimeWindow();
      return Promise.all(
        TIMELINE_METRIC_NAMES.map(async (metricName) => ({
          metricName,
          ...(await queryMetrics(
            {
              clusterId,
              metricName,
              ...window,
              bucketMs: METRIC_BUCKET_MS,
              aggregations: ["avg", "max"],
              limit: 500,
            },
            { signal },
          )),
        })),
      );
    },
    [clusterId],
    { enabled: Boolean(clusterId), pollMs: livePollMs, paused },
  );

  const logs = useMemo(
    () => (logsQuery.data?.items ?? []).map(adaptLogRecord),
    [logsQuery.data],
  );
  const applications = useMemo(() => applicationOptions(logs), [logs]);
  const selectedApplication = requestedApplication && applications.some((item) => item.value === requestedApplication)
    ? requestedApplication
    : "";
  const applicationLogCount = applications.reduce((total, item) => total + item.count, 0);
  const split = useMemo(
    () => splitRuntimeTelemetry(logs, selectedApplication),
    [logs, selectedApplication],
  );
  const applicationLogs = useMemo(
    () => split.applicationLogs.filter((item) => matchesRuntimeSearch(item, search)),
    [split.applicationLogs, search],
  );
  const environmentItems = useMemo(() => {
    const systemLogs = split.environmentLogs.map((item) => ({ ...item, entryType: "log" }));
    const events = (eventsQuery.data?.items ?? [])
      .map(adaptKubernetesEvent)
      .map((item) => ({ ...item, entryType: "event" }));
    return [...systemLogs, ...events]
      .filter((item) => matchesRuntimeSearch(item, search))
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }, [eventsQuery.data, search, split.environmentLogs]);

  const environmentQuery = {
    ...eventsQuery,
    data: logsQuery.data && eventsQuery.data ? environmentItems : null,
    loading: logsQuery.loading || eventsQuery.loading,
    error: logsQuery.error ?? eventsQuery.error,
    refetch: () => Promise.all([logsQuery.refetch(), eventsQuery.refetch()]),
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Runtime", "Telemetry"]} />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Runtime Monitoring</h1>
            <p className="text-sm text-gray-500 mt-1">Application health, Kubernetes activity, and stored telemetry from the last hour.</p>
          </div>
          <button type="button" onClick={() => setPaused((value) => !value)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm font-semibold text-gray-700">
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? "Resume" : "Pause"} refresh
          </button>
        </div>

        <div className="flex gap-3 flex-wrap bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <label className="flex flex-col gap-1 min-w-48">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cluster</span>
            <select aria-label="Cluster" value={clusterId} onChange={(event) => { setSelectedCluster(event.target.value); setRequestedApplication(""); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
              <option value="" disabled>Select cluster</option>
              {(clusters.data ?? []).map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name ?? cluster.id}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 min-w-52">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Application</span>
            <select aria-label="Application workload" value={selectedApplication} onChange={(event) => setRequestedApplication(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
              <option value="">All applications ({applicationLogCount})</option>
              {applications.map((item) => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 min-w-44">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Severity</span>
            <select aria-label="Severity" value={severity} onChange={(event) => setSeverity(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
              <option value="">All severities</option>
              {LOG_SEVERITIES.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="relative flex-1 min-w-56 self-end">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter loaded telemetry" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg" />
          </label>
        </div>

        <StaleBanner error={logsQuery.data ? logsQuery.error : null} onRetry={logsQuery.refetch} />
        <StaleBanner error={metricsQuery.data ? metricsQuery.error : null} onRetry={metricsQuery.refetch} />

        <RuntimeMetricChart query={metricsQuery} />

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5 items-start">
          <TelemetryLogSection
            kind="application"
            title="Application logs"
            description={selectedApplication ? `Filtered workload · ${selectedApplication}` : "All detected customer workloads"}
            items={applicationLogs}
            query={logsQuery}
            paused={paused}
          />
          <TelemetryLogSection
            kind="environment"
            title="Kubernetes environment logs"
            description="Kubernetes system workloads and cluster events only"
            items={environmentItems}
            query={environmentQuery}
            paused={paused}
          />
        </div>
      </main>
    </div>
  );
}
