import { Pause, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { adaptLogRecord } from "../api/adapters";
import { listClusters, LOG_SEVERITIES, searchLogs } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { livePollMs, useApiResource } from "../hooks/useApiResource";

const LEVEL_STYLE = { INFO: "text-blue-400", WARN: "text-yellow-400", ERROR: "text-red-400", DEBUG: "text-gray-500" };

export default function RuntimeMonitoringPage() {
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("");
  const clusters = useApiResource(({ signal }) => listClusters({ signal }), []);
  const clusterId = selectedCluster || clusters.data?.[0]?.id || "";
  const logsQuery = useApiResource(({ signal }) => {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    return searchLogs({ clusterId, startTime: start.toISOString(), endTime: end.toISOString(), severity, limit: 250 }, { signal });
  }, [clusterId, severity], { enabled: Boolean(clusterId), pollMs: livePollMs, paused });
  const logs = useMemo(() => (logsQuery.data?.items ?? []).map(adaptLogRecord).filter((item) => !search.trim() || `${item.level} ${item.source} ${item.msg}`.toLowerCase().includes(search.toLowerCase())), [logsQuery.data, search]);

  return <div className="flex flex-col flex-1">
    <TopBar breadcrumbs={["Runtime", "Logs"]} />
    <main className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-gray-900">Runtime Monitoring</h1><p className="text-sm text-gray-500 mt-1">Stored telemetry logs from the last hour.</p></div><button type="button" onClick={() => setPaused((value) => !value)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm font-semibold text-gray-700">{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? 'Resume' : 'Pause'} refresh</button></div>
      <div className="flex gap-3 flex-wrap bg-white border border-gray-200 rounded-xl p-4">
        <select aria-label="Cluster" value={clusterId} onChange={(event) => setSelectedCluster(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="" disabled>Select cluster</option>{(clusters.data ?? []).map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name ?? cluster.id}</option>)}</select>
        <select aria-label="Severity" value={severity} onChange={(event) => setSeverity(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="">All severities</option>{LOG_SEVERITIES.map((value) => <option key={value}>{value}</option>)}</select>
        <label className="relative flex-1 min-w-56"><Search size={14} className="absolute left-3 top-2.5 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter loaded messages" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg" /></label>
      </div>
      <StaleBanner error={logsQuery.data ? logsQuery.error : null} onRetry={logsQuery.refetch} />
      <section className="bg-[#111827] rounded-xl border border-gray-700 shadow-sm overflow-hidden min-h-[480px]">
        <div className="px-4 py-3 border-b border-gray-700 flex justify-between text-xs"><span className="font-semibold text-gray-300">{clusterId || 'No cluster selected'}</span><span className="text-gray-500">{paused ? 'Refresh paused' : `${logs.length} log entries`}</span></div>
        <AsyncSection {...logsQuery} data={logsQuery.data ? logs : null} onRetry={logsQuery.refetch} isEmpty={(items) => items.length === 0} emptyTitle="No logs in this window" emptyHint="Telemetry storage returned no matching records.">
          <div className="p-4 font-mono text-xs space-y-1 max-h-[620px] overflow-y-auto">{logs.map((log) => <div key={log.id} className={`grid grid-cols-[82px_58px_160px_1fr] gap-3 py-1 ${log.highlight ? 'bg-red-950/30 -mx-2 px-2 rounded' : ''}`}><time className="text-gray-500">{log.ts}</time><span className={LEVEL_STYLE[log.level]}>{log.level}</span><span className="text-cyan-400 truncate" title={log.source}>{log.source}</span><span className="text-gray-300 break-words">{log.msg}</span></div>)}</div>
        </AsyncSection>
      </section>
    </main>
  </div>;
}
