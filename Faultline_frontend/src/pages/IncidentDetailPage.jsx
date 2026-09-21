import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Circle,
  FileText,
  GitBranch,
  Gauge,
  RefreshCw,
  ScrollText,
  TerminalSquare,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import TopBar from "../components/layout/TopBar";
import IncidentHeader from "../components/incidents/IncidentHeader";
import IncidentTechnicalReport from "../components/incidents/IncidentTechnicalReport";
import IncidentTimeline from "../components/incidents/IncidentTimeline";
import SlackTicketStatus from "../components/incidents/SlackTicketStatus";
import StatusPill from "../components/ui/StatusPill";
import { AsyncSection, EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { useApiResource } from "../hooks/useApiResource";
import { useIncidentReport, useIncidentSlackTicket } from "../hooks/useReporting";
import { getIncident, getIncidentEvidence, listBaselines } from "../api/endpoints";
import {
  adaptBaseline,
  adaptIncident,
  adaptKubernetesEvent,
  adaptLogRecord,
  classificationLabel,
  formatMetricValue,
  formatTimestamp,
  groupMetricSamples,
  sourceLabel,
} from "../api/adapters";

const LOG_COLORS = { INFO: "text-blue-500", WARN: "text-yellow-500", ERROR: "text-red-500", DEBUG: "text-gray-400" };

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("evidence");

  const incidentQuery = useApiResource(({ signal }) => getIncident(id, { signal }), [id]);
  const reportQuery = useIncidentReport(id);
  const slackTicketQuery = useIncidentSlackTicket(id);

  // The evidence window is a second, heavier read (it hits ClickHouse), so it is kept
  // separate: the incident header still renders when telemetry history is unavailable.
  const evidenceQuery = useApiResource(
    ({ signal }) => getIncidentEvidence(id, { limit: 100 }, { signal }),
    [id],
    { enabled: Boolean(incidentQuery.data) },
  );

  const incident = useMemo(() => adaptIncident(incidentQuery.data), [incidentQuery.data]);

  if (incidentQuery.loading && !incidentQuery.data) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar breadcrumbs={["Incidents", "Detail"]} />
        <LoadingState label="Loading incident…" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar breadcrumbs={["Incidents", "Detail"]} />
        <div className="p-6">
          <button
            type="button"
            onClick={() => navigate("/incidents")}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium mb-4"
          >
            <ArrowLeft size={14} /> Back to Incidents
          </button>
          <ErrorState error={incidentQuery.error} onRetry={incidentQuery.refetch} />
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "evidence", label: "Evidence", icon: Bot },
    { key: "logs", label: "Error Logs", icon: TerminalSquare },
    { key: "events", label: "K8s Events", icon: ScrollText },
    { key: "metrics", label: "Metrics", icon: Activity },
    { key: "baselines", label: "Baselines", icon: Gauge },
    { key: "report", label: "Technical Report", icon: FileText },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Incidents", incident.id.slice(0, 8), "Detail"]}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                incidentQuery.refetch();
                evidenceQuery.refetch();
                reportQuery.refetch();
                slackTicketQuery.refetch();
              }}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-3 py-1.5 rounded-lg"
            >
              <RefreshCw size={14} className={incidentQuery.refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate(`/incidents/${encodeURIComponent(id)}/pr`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              <GitBranch size={14} /> Issue PR
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <button
          type="button"
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
        >
          <ArrowLeft size={14} /> Back to Incidents
        </button>

        {/* Lifecycle, derived from the incident's own state */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            {incident.progress.map((step, index) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  {step.done ? (
                    <CheckCircle2 size={28} className="text-blue-600" />
                  ) : (
                    <Circle size={28} className="text-gray-300" />
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                      step.done ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.at && <span className="text-[9px] text-gray-400">{formatTimestamp(step.at)}</span>}
                </div>
                {index < incident.progress.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      step.done && incident.progress[index + 1]?.done ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <IncidentHeader incident={incident} report={reportQuery.data} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          <div className="xl:col-span-2 space-y-4 min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 bg-gray-50/40 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "border-blue-600 text-blue-700 bg-white"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === "evidence" && <EvidenceTab incident={incident} timeline={reportQuery.data?.timeline} />}
                {activeTab === "logs" && <LogsTab query={evidenceQuery} />}
                {activeTab === "events" && <EventsTab query={evidenceQuery} />}
                {activeTab === "metrics" && <MetricsTab query={evidenceQuery} />}
                {activeTab === "baselines" && <BaselinesTab incident={incident} />}
                {activeTab === "report" && <IncidentTechnicalReport query={reportQuery} incidentId={id} />}
              </div>
            </div>
          </div>

          {/* Side rail */}
          <div className="space-y-4">
            <SlackTicketStatus query={slackTicketQuery} />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Remediation</h3>
              <p className="text-[11px] text-gray-400 mb-3">
                Automated remediation has no API endpoint yet and remains disabled.
              </p>

              <div className="border border-gray-100 rounded-lg p-3 mb-3 opacity-60">
                <div className="flex items-center gap-2 mb-1.5">
                  <Bot size={14} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Assign to AI Agent</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Draft a PR and run validation tests, with a pre-execution safety check.
                </p>
                <button
                  type="button"
                  disabled
                  title="No API endpoint for remediation yet"
                  className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg cursor-not-allowed"
                >
                  ▶ Execute Auto-Fix
                </button>
              </div>

            </div>

            {/* Affected resources, straight from the incident */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Affected Resources <span className="text-gray-400 font-medium">({incident.affectedAssets.length})</span>
              </h3>
              {incident.affectedAssets.map((asset) => (
                <div
                  key={asset.resourceId ?? asset.name}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg mb-2 last:mb-0 bg-gray-50 border border-gray-100"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-gray-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{asset.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {asset.scope}
                      {asset.namespace ? ` · ${asset.namespace}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Anomalies that were correlated into this incident */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Anomalies <span className="text-gray-400 font-medium">({incident.anomalies.length})</span>
              </h3>
              {incident.anomalies.length === 0 ? (
                <p className="text-xs text-gray-400">No anomalies attached.</p>
              ) : (
                incident.anomalies.map((anomaly) => (
                  <div key={anomaly.anomalyId} className="border-b border-gray-50 last:border-0 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-800">
                        {classificationLabel(anomaly.classification)}
                      </span>
                      <StatusPill status={anomaly.severity} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{anomaly.summary}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                      {sourceLabel(anomaly.source)}
                      {Number.isFinite(anomaly.anomalyScore) ? ` · score ${anomaly.anomalyScore.toFixed(2)}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Structured evidence stored with the incident in PostgreSQL — the entries that made
 * Faultline call this an incident, with the anomaly and source each came from.
 */
function EvidenceTab({ incident, timeline: reportTimeline }) {
  const timeline = reportTimeline ?? incident.timeline;
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Correlated Evidence</h3>
        {incident.evidence.length === 0 ? (
          <EmptyState title="No structured evidence recorded" />
        ) : (
          <div className="space-y-2">
            {incident.evidence.map((entry, index) => (
              <div key={`${entry.anomalyId}-${index}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50/60">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs font-bold text-gray-800">{classificationLabel(entry.classification)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {entry.type}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{entry.summary}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">
                  {sourceLabel(entry.source)}
                </p>
                {entry.attributes && Object.keys(entry.attributes).length > 0 && (
                  <dl className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-gray-200">
                    {Object.entries(entry.attributes).map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <dt className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">{key}</dt>
                        <dd className="text-xs text-gray-700 font-mono truncate">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Incident Timeline</h3>
        <IncidentTimeline entries={timeline} />
      </section>
    </div>
  );
}

function LogsTab({ query }) {
  const logs = useMemo(
    () => (query.data?.telemetry?.errorLogs ?? []).map(adaptLogRecord),
    [query.data],
  );
  return (
    <AsyncSection
      loading={query.loading}
      error={query.error}
      data={query.data}
      onRetry={query.refetch}
      loadingLabel="Loading evidence window…"
      isEmpty={() => logs.length === 0}
      emptyTitle="No error logs in the evidence window"
      emptyHint="The incident's window contains no logs at error or fatal severity."
    >
      <>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          {logs.length} error/fatal entries · {formatTimestamp(query.data?.window?.startTime)} →{" "}
          {formatTimestamp(query.data?.window?.endTime)}
        </p>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-950 p-3 font-mono text-[12px] max-h-96 overflow-y-auto space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <span className="text-gray-500 flex-shrink-0">{log.ts}</span>
                <span className={`font-bold flex-shrink-0 ${LOG_COLORS[log.level]}`}>[{log.level}]</span>
                <span className="text-gray-500 text-[10px] flex-shrink-0">{log.source}</span>
                <span className="text-gray-200 break-all">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    </AsyncSection>
  );
}

function EventsTab({ query }) {
  const events = useMemo(
    () => (query.data?.telemetry?.kubernetesEvents ?? []).map(adaptKubernetesEvent),
    [query.data],
  );
  return (
    <AsyncSection
      loading={query.loading}
      error={query.error}
      data={query.data}
      onRetry={query.refetch}
      loadingLabel="Loading Kubernetes events…"
      isEmpty={() => events.length === 0}
      emptyTitle="No warning events in the evidence window"
    >
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <StatusPill status={event.type} />
                <span className="text-xs font-bold text-gray-800">{event.reason}</span>
                <span className="text-xs text-gray-400 font-mono">{event.resource}</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {formatTimestamp(event.timestamp)}
                {event.count > 1 ? ` · ×${event.count}` : ""}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1.5">{event.message}</p>
          </div>
        ))}
      </div>
    </AsyncSection>
  );
}

function MetricsTab({ query }) {
  const groups = useMemo(() => groupMetricSamples(query.data?.telemetry?.metrics ?? []), [query.data]);
  return (
    <AsyncSection
      loading={query.loading}
      error={query.error}
      data={query.data}
      onRetry={query.refetch}
      loadingLabel="Loading metric samples…"
      isEmpty={() => groups.length === 0}
      emptyTitle="No metric samples in the evidence window"
      emptyHint="The primary resource reported none of the timeline metrics during this window."
    >
      <div className="grid grid-cols-2 gap-4">
        {groups.map((group) => (
          <div key={group.metricName} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold text-gray-700">{group.label}</p>
              <p className="text-sm font-bold text-gray-900">{formatMetricValue(group.latest, group.unit)}</p>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">
              {group.samples.length} samples · latest {formatTimestamp(group.latestAt)}
            </p>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={group.points} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  tickFormatter={(value) => formatMetricValue(value, group.unit)}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(value) => formatMetricValue(value, group.unit)}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </AsyncSection>
  );
}

/**
 * The baselines the statistical anomalies were measured against — the answer to
 * "why did Faultline call that abnormal?".
 */
function BaselinesTab({ incident }) {
  const resource = incident.primaryResource;
  const workload = resource?.workload ?? null;

  const query = useApiResource(
    ({ signal }) =>
      listBaselines(
        {
          clusterId: incident.clusterId,
          namespace: incident.namespace ?? resource?.namespace,
          workload,
          limit: 50,
        },
        { signal },
      ),
    [incident.clusterId, incident.namespace, resource?.namespace, workload],
    { enabled: Boolean(workload) },
  );

  const baselines = useMemo(() => (query.data?.items ?? []).map(adaptBaseline), [query.data]);

  if (!workload) {
    return (
      <EmptyState
        title="No workload to baseline"
        hint="Baselines are computed per workload; this incident's primary resource is not a workload."
      />
    );
  }

  return (
    <AsyncSection
      loading={query.loading}
      error={query.error}
      data={query.data}
      onRetry={query.refetch}
      loadingLabel="Loading baselines…"
      isEmpty={() => baselines.length === 0}
      emptyTitle="No baselines computed for this workload"
      emptyHint="Faultline needs enough clean history before it can describe what normal looks like."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["METRIC", "WINDOW", "STATUS", "MEAN", "P95", "P99", "SAMPLES", "UPDATED"].map((header) => (
                <th
                  key={header}
                  className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baselines.map((baseline) => (
              <tr key={`${baseline.metricName}-${baseline.window}`} className="border-b border-gray-50">
                <td className="px-3 py-3 font-medium text-gray-800">{baseline.label}</td>
                <td className="px-3 py-3 text-gray-500">{baseline.window}</td>
                <td className="px-3 py-3">
                  <StatusPill
                    status={baseline.status}
                    label={baseline.ready ? "Ready" : "Not ready"}
                  />
                </td>
                <td className="px-3 py-3 font-mono text-xs text-gray-700">{baseline.display.mean}</td>
                <td className="px-3 py-3 font-mono text-xs text-gray-700">{baseline.display.p95}</td>
                <td className="px-3 py-3 font-mono text-xs text-gray-700">{baseline.display.p99}</td>
                <td className="px-3 py-3 text-gray-500 text-xs">{baseline.sampleCount}</td>
                <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{baseline.display.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AsyncSection>
  );
}
