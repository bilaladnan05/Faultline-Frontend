import { useMemo, useState } from "react";
import { Search, Pause, Play, RefreshCw, TerminalSquare } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource, livePollMs } from "../hooks/useApiResource";
import { getReadiness, searchKubernetesEvents, searchLogs, LOG_SEVERITIES } from "../api/endpoints";
import { adaptKubernetesEvent, adaptLogRecord, formatTimestamp } from "../api/adapters";
import { EVENT_RANGES, findRange, windowEndingNow } from "../api/window";
import { apiBaseUrl } from "../api/client";
import { useProject } from "../context/ProjectContext";

const LEVEL_STYLE = {
  INFO: "text-blue-400",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
  DEBUG: "text-gray-500",
};

const SEVERITY_PRESETS = [
  { key: "all", label: "All", severities: undefined },
  { key: "problems", label: "Warn+", severities: ["warn", "error", "fatal"] },
  { key: "errors", label: "Errors", severities: ["error", "fatal"] },
];

export default function RuntimeMonitoringPage() {
  const { activeProject } = useProject();
  const clusterId = activeProject?.clusterId;

  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const [severityKey, setSeverityKey] = useState("problems");
  const [rangeKey, setRangeKey] = useState("1h");
  const [namespace, setNamespace] = useState("All");

  const range = findRange(EVENT_RANGES, rangeKey);
  const severities = SEVERITY_PRESETS.find((preset) => preset.key === severityKey)?.severities;

  // `search` goes to the API: the logs endpoint does a case-insensitive substring match
  // on the stored message, so filtering server-side keeps the page limit meaningful.
  const term = search.trim();

  const logs = useApiResource(
    ({ signal }) =>
      searchLogs(
        {
          clusterId,
          namespace: namespace === "All" ? undefined : namespace,
          severity: severities,
          search: term || undefined,
          ...windowEndingNow(range.durationMs),
          limit: 200,
        },
        { signal },
      ),
    [clusterId, namespace, severityKey, term, range.durationMs],
    { pollMs: livePollMs, enabled: Boolean(clusterId), paused },
  );

  const events = useApiResource(
    ({ signal }) =>
      searchKubernetesEvents(
        {
          clusterId,
          namespace: namespace === "All" ? undefined : namespace,
          type: "Warning",
          ...windowEndingNow(range.durationMs),
          limit: 50,
        },
        { signal },
      ),
    [clusterId, namespace, range.durationMs],
    { pollMs: livePollMs, enabled: Boolean(clusterId), paused },
  );

  const readiness = useApiResource(({ signal }) => getReadiness({ signal }), [], { pollMs: livePollMs });

  const logLines = useMemo(() => (logs.data?.items ?? []).map(adaptLogRecord), [logs.data]);
  const eventRows = useMemo(() => (events.data?.items ?? []).map(adaptKubernetesEvent), [events.data]);
  const namespaces = useMemo(() => ["All", ...(activeProject?.namespaces ?? [])], [activeProject]);

  const readinessStatus = readiness.data?.status ?? readiness.error?.body?.status ?? "unavailable";
  const healthy = readinessStatus === "ok";

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={activeProject ? ["Deployments", activeProject.name, "Runtime"] : ["Runtime", "Monitoring"]} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Runtime Monitoring</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Logs and Kubernetes events retained for{" "}
              <span className="font-semibold text-gray-700">{clusterId}</span>, polled every{" "}
              {Math.round(livePollMs / 1000)}s.
            </p>
          </div>
          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
              healthy
                ? "bg-green-50 border-green-200 text-green-700"
                : readinessStatus === "degraded"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                  : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                healthy ? "bg-green-500" : readinessStatus === "degraded" ? "bg-yellow-500" : "bg-red-500"
              }`}
            />
            {healthy ? "Storage healthy" : readinessStatus === "degraded" ? "Storage degraded" : "Storage unavailable"}
          </div>
        </div>

        {/* Connection panel — the real one: an HTTP poll against the Faultline API. */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">API Connection</p>
          <div className="grid grid-cols-4 gap-4">
            <Metric label="Endpoint" value={`${apiBaseUrl}/telemetry/logs`} mono />
            <Metric label="Transport" value={`HTTP poll · ${Math.round(livePollMs / 1000)}s`} />
            <Metric
              label="Last update"
              value={logs.updatedAt ? logs.updatedAt.toLocaleTimeString([], { hour12: false }) : "—"}
              mono
            />
            <Metric
              label="Entries in window"
              value={logs.data ? String(logLines.length) : "—"}
              cls={paused ? "text-yellow-600" : "text-gray-900"}
            />
          </div>
          {logs.data?.query && (
            <p className="text-[11px] text-gray-400 mt-3">
              Window {formatTimestamp(logs.data.query.startTime)} → {formatTimestamp(logs.data.query.endTime)} · server
              limit {logs.data.query.limit}
              {logs.data.nextCursor ? " · more available" : ""}
            </p>
          )}
        </div>

        <StaleBanner error={logs.data ? logs.error : null} onRetry={logs.refetch} />

        <div className="grid grid-cols-3 gap-5 items-start">
          {/* Log stream */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-gray-900">Log Stream</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex items-center">
                  <Search size={12} className="absolute left-2.5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search messages…"
                    className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 placeholder:text-gray-400"
                  />
                </div>

                {namespaces.length > 1 && (
                  <select
                    value={namespace}
                    onChange={(event) => setNamespace(event.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {namespaces.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                )}

                <div className="flex gap-1">
                  {SEVERITY_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setSeverityKey(preset.key)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                        severityKey === preset.key
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1">
                  {EVENT_RANGES.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setRangeKey(option.key)}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-lg border transition-colors ${
                        rangeKey === option.key
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    paused
                      ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {paused ? <Play size={12} /> : <Pause size={12} />}
                  {paused ? "Resume" : "Pause"}
                </button>

                <button
                  type="button"
                  onClick={logs.refetch}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw size={12} className={logs.refreshing ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            <AsyncSection
              loading={logs.loading}
              error={logs.error}
              data={logs.data}
              onRetry={logs.refetch}
              loadingLabel="Loading logs…"
              isEmpty={() => logLines.length === 0}
              emptyIcon={TerminalSquare}
              emptyTitle="No log entries in this window"
              emptyHint={`No ${severityKey === "all" ? "" : `${severityKey} `}logs were retained for ${clusterId} in the last ${range.label}.`}
            >
              <div className="bg-gray-950 font-mono text-[12px] max-h-[28rem] overflow-y-auto p-3 space-y-1">
                {paused && (
                  <div className="flex items-center gap-2 bg-yellow-900/30 text-yellow-300 text-[11px] font-semibold px-3 py-1.5 rounded mb-2 border border-yellow-700/30">
                    <Pause size={11} /> Polling paused — showing the last response
                  </div>
                )}
                {logLines.map((line) => (
                  <div key={line.id} className="flex gap-3 hover:bg-white/5 px-1 py-0.5 rounded">
                    <span className="text-gray-600 flex-shrink-0">{line.ts}</span>
                    <span className={`flex-shrink-0 font-bold w-12 ${LEVEL_STYLE[line.level]}`}>[{line.level}]</span>
                    <span className="text-gray-500 text-[10px] flex-shrink-0 w-32 truncate" title={line.source}>
                      {line.source}
                    </span>
                    <span className={line.highlight ? "text-red-300" : "text-gray-300"}>{line.msg}</span>
                  </div>
                ))}
              </div>
            </AsyncSection>
          </div>

          {/* Kubernetes warning events */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Warning Events</h2>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {eventRows.length} in {range.label}
              </span>
            </div>
            <div className="p-4">
              <AsyncSection
                loading={events.loading}
                error={events.error}
                data={events.data}
                onRetry={events.refetch}
                loadingLabel="Loading events…"
                isEmpty={() => eventRows.length === 0}
                emptyTitle="No warning events"
                emptyHint="Kubernetes reported nothing abnormal in this window."
              >
                <div className="space-y-3 max-h-[26rem] overflow-y-auto">
                  {eventRows.map((event) => (
                    <div key={event.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 truncate">{event.reason}</span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{event.ts}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{event.message}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-gray-400 truncate">{event.resource}</span>
                        <StatusPill status={event.type} />
                      </div>
                    </div>
                  ))}
                </div>
              </AsyncSection>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Severities the API accepts: {LOG_SEVERITIES.join(", ")}. Windows are bounded — the API refuses an unbounded
          telemetry query.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, mono = false, cls = "text-gray-900" }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold mt-0.5 truncate ${mono ? "font-mono" : ""} ${cls}`} title={value}>
        {value}
      </p>
    </div>
  );
}
