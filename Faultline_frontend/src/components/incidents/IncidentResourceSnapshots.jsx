import { Cpu, MemoryStick } from "lucide-react";
import { formatMetricValue, formatTimestamp, resourceLabel } from "../../api/adapters";
import { EmptyState } from "../ui/AsyncState";

/** Historical resource state captured by the processor when the incident opened. */
export default function IncidentResourceSnapshots({ snapshots = [], empty = true }) {
  if (!snapshots.length) {
    return empty ? (
      <EmptyState
        title="No CPU or memory snapshot was recorded."
        hint="This incident may predate snapshot capture, or its resource state was unavailable when it opened."
        className="py-8"
      />
    ) : null;
  }

  return (
    <div className="space-y-3">
      {snapshots.map((snapshot, index) => (
        <article
          key={`${snapshot.timestamp ?? snapshot.observedAt}-${index}`}
          className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{resourceLabel(snapshot.resource)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Observed {formatTimestamp(snapshot.observedAt)} · incident {formatTimestamp(snapshot.timestamp)}
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-1 uppercase tracking-wider">
              Incident-time snapshot
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SnapshotMetric
              icon={Cpu}
              label="CPU"
              usage={formatCores(snapshot.cpuUsageCores)}
              utilization={formatPercent(snapshot.cpuUtilizationPercent)}
              limit={formatCores(snapshot.cpuLimitCores)}
              request={formatCores(snapshot.cpuRequestCores)}
            />
            <SnapshotMetric
              icon={MemoryStick}
              label="Memory"
              usage={formatMetricValue(snapshot.memoryUsageBytes, "bytes")}
              utilization={formatPercent(snapshot.memoryUtilizationPercent)}
              limit={formatMetricValue(snapshot.memoryLimitBytes, "bytes")}
              request={formatMetricValue(snapshot.memoryRequestBytes, "bytes")}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function SnapshotMetric({ icon: Icon, label, usage, utilization, limit, request }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-gray-400" aria-hidden="true" />
        <p className="text-xs font-bold text-gray-700">{label}</p>
      </div>
      <p className="text-xl font-bold font-mono text-gray-900">{utilization}</p>
      <dl className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
        <Value label="Usage" value={usage} />
        <Value label="Request" value={request} />
        <Value label="Limit" value={limit} />
      </dl>
    </div>
  );
}

function Value({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-gray-400 uppercase tracking-wider">{label}</dt>
      <dd className="font-mono font-semibold text-gray-700 truncate" title={value}>{value}</dd>
    </div>
  );
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "Not recorded";
}

function formatCores(value) {
  return Number.isFinite(value) ? `${Number(value.toFixed(3))} cores` : "Not recorded";
}
