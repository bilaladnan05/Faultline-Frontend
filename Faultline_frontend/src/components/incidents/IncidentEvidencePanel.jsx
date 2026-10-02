import {
  classificationLabel,
  formatTimestamp,
  resourceLabel,
  sourceLabel,
} from "../../api/adapters";
import { AsyncSection, StaleBanner } from "../ui/AsyncState";
import StatusPill from "../ui/StatusPill";
import IncidentResourceSnapshots from "./IncidentResourceSnapshots";

/**
 * Explains an incident from the correlated anomaly aggregate, then shows the raw
 * supporting records returned by the evidence endpoint. This works for every
 * classification and does not infer a root cause that the backend has not confirmed.
 */
export default function IncidentEvidencePanel({ query, incident }) {
  const payload = query.data;
  const signals = incident?.anomalies ?? [];
  const anomalyEvidence = payload?.anomalyEvidence ?? payload?.evidence ?? incident?.evidence ?? [];
  const logs = payload?.telemetry?.errorLogs ?? payload?.telemetry?.logs ?? payload?.logs ?? [];
  const events = payload?.telemetry?.kubernetesEvents ?? payload?.kubernetesEvents ?? payload?.events ?? [];
  const metrics = payload?.telemetry?.metrics ?? payload?.metrics ?? [];
  const resourceSnapshots = payload?.resourceSnapshots ?? incident?.resourceSnapshots ?? [];
  const anomaliesById = new Map(signals.map((item) => [item.anomalyId, item]));
  const evidenceCount = signals.length + anomalyEvidence.length + logs.length + events.length + metrics.length + resourceSnapshots.length;

  return (
    <AsyncSection
      {...query}
      data={payload ?? (incident ? { incidentFallback: true } : null)}
      onRetry={query.refetch}
      isEmpty={() => evidenceCount === 0}
      emptyTitle="No evidence in this incident window"
    >
      <div className="space-y-5">
        <StaleBanner error={!payload ? query.error : null} onRetry={query.refetch} />
        {resourceSnapshots.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              CPU and memory at incident detection
            </h3>
            <IncidentResourceSnapshots snapshots={resourceSnapshots} empty={false} />
          </section>
        )}
        {signals.length > 0 && (
          <section>
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 mb-3">
              <p className="text-xs font-bold text-blue-900">Why Faultline opened this incident</p>
              <p className="text-sm text-blue-800 mt-1">
                {incident.primarySignal ? `Primary signal: ${incident.primarySignal.label}. ` : ""}
                Faultline correlated {signals.length} anomaly{signals.length === 1 ? " signal" : " signals"} into {incident.classificationLabel}.
                {" "}These are observations, not a confirmed root cause.
              </p>
            </div>
            <EvidenceList title="Triggering signals" items={signals} render={(item) => (
              <>
                <div className="flex gap-2 items-center flex-wrap">
                  <StatusPill status={item.severity} />
                  <span className="text-xs font-semibold text-gray-700">{classificationLabel(item.classification)}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{sourceLabel(item.source)}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 mt-1">{item.summary}</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {formatTimestamp(item.timestamp ?? item.firstSeen)} · {resourceLabel(item.affectedResource)}
                  {Number.isFinite(item.confidence) ? ` · ${Math.round(item.confidence * 100)}% confidence` : ""}
                </p>
                <EvidenceFacts evidence={item.evidence} />
              </>
            )} />
          </section>
        )}

        <EvidenceList title="Supporting evidence" items={anomalyEvidence} render={(item) => {
          const anomaly = anomaliesById.get(item.anomalyId);
          return (
            <>
              <div className="flex gap-2 items-center flex-wrap">
                {(item.severity ?? anomaly?.severity) && <StatusPill status={item.severity ?? anomaly?.severity} />}
                <span className="text-xs font-semibold text-gray-700">
                  {classificationLabel(item.classification ?? anomaly?.classification)}
                </span>
                {(item.source ?? anomaly?.source) && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {sourceLabel(item.source ?? anomaly?.source)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-1">{item.summary ?? item.message ?? "Evidence recorded by the processor."}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {formatTimestamp(item.timestamp ?? item.eventTimestamp)} · {resourceLabel(item.affectedResource ?? item.resource ?? anomaly?.affectedResource)}
              </p>
              <AttributeFacts attributes={item.attributes} />
            </>
          );
        }} />

        <EvidenceList title="Logs" items={logs} render={(item) => (
          <>
            <p className="text-xs font-mono text-gray-400">{formatTimestamp(item.eventTimestamp ?? item.timestamp)} · {item.severity}</p>
            <p className="text-sm font-mono text-gray-700 break-words mt-1">{item.message}</p>
          </>
        )} />
        <EvidenceList title="Kubernetes events" items={events} render={(item) => (
          <>
            <p className="text-xs font-semibold text-gray-700">{item.reason ?? item.type}</p>
            <p className="text-sm text-gray-600 mt-1">{item.message}</p>
          </>
        )} />
        <EvidenceList title="Metric samples" items={metrics} render={(item) => (
          <>
            <p className="text-xs font-semibold text-gray-700">{item.name ?? item.metricName ?? "Metric"}</p>
            <p className="text-sm font-mono text-gray-700 mt-1">{formatMetricValue(item)}</p>
            <p className="text-[10px] text-gray-400 mt-1">{formatTimestamp(item.timestamp ?? item.eventTimestamp)}</p>
          </>
        )} />
      </div>
    </AsyncSection>
  );
}

function EvidenceFacts({ evidence = [] }) {
  const facts = evidence.flatMap((item) => Object.entries(item.attributes ?? {}));
  if (!facts.length) return null;
  return <AttributeFacts attributes={Object.fromEntries(facts)} />;
}

function AttributeFacts({ attributes }) {
  const entries = Object.entries(attributes ?? {}).slice(0, 8);
  if (!entries.length) return null;
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-gray-100">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-1 text-[11px]">
          <dt className="text-gray-400">{attributeLabel(key)}:</dt>
          <dd className="font-mono font-semibold text-gray-600">{attributeValue(key, value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function attributeLabel(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
}

function attributeValue(key, value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number" && /percent|percentage/i.test(key)) return `${value.toFixed(2)}%`;
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

function formatMetricValue(item) {
  const value = item.value ?? item.metricValue ?? item.sum ?? item.gauge;
  if (value === null || value === undefined) return "Value unavailable";
  return `${typeof value === "number" ? Number(value.toFixed(4)) : value}${item.unit ? ` ${item.unit}` : ""}`;
}

function EvidenceList({ title, items, render }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title} ({items.length})</h3>
      <div className="space-y-2">
        {items.slice(0, 100).map((item, index) => (
          <article key={`${item.id ?? item.eventId ?? item.anomalyId ?? "evidence"}-${index}`} className="border border-gray-200 rounded-lg p-3">
            {render(item)}
          </article>
        ))}
      </div>
    </section>
  );
}
