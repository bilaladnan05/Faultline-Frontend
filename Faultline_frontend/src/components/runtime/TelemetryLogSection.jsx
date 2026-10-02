import { Box, Network } from "lucide-react";
import { AsyncSection } from "../ui/AsyncState";

const LEVEL_STYLE = {
  INFO: "text-blue-400",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
  DEBUG: "text-gray-500",
};

export default function TelemetryLogSection({ kind, title, description, items, query, paused }) {
  const Icon = kind === "application" ? Box : Network;
  return (
    <section aria-labelledby={`${kind}-logs-title`} className="bg-[#111827] rounded-xl border border-gray-700 shadow-sm overflow-hidden min-h-[360px]">
      <div className="px-4 py-3 border-b border-gray-700 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon size={15} className={kind === "application" ? "text-blue-400 mt-0.5" : "text-violet-400 mt-0.5"} aria-hidden="true" />
          <div>
            <h2 id={`${kind}-logs-title`} className="text-xs font-bold text-gray-200">{title}</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paused ? "Refresh paused" : `${items.length} entries`}</span>
      </div>
      <AsyncSection
        {...query}
        data={query.data ? items : null}
        onRetry={query.refetch}
        isEmpty={(rows) => rows.length === 0}
        emptyTitle={kind === "application" ? "No application logs in this window" : "No Kubernetes environment activity"}
        emptyHint={kind === "application" ? "Choose another application or wait for it to emit logs." : "No system logs or Kubernetes events matched the current filters."}
      >
        <div className="p-4 font-mono text-xs space-y-1 max-h-[520px] overflow-y-auto scrollbar-thin">
          {items.map((item) => item.entryType === "event" ? <EventRow key={`event-${item.id}`} event={item} /> : <LogRow key={`log-${item.id}`} log={item} />)}
        </div>
      </AsyncSection>
    </section>
  );
}

function LogRow({ log }) {
  return (
    <div className={`grid grid-cols-[72px_52px_minmax(90px,150px)_1fr] gap-3 py-1 ${log.highlight ? "bg-red-950/30 -mx-2 px-2 rounded" : ""}`}>
      <time className="text-gray-500">{log.ts}</time>
      <span className={LEVEL_STYLE[log.level] ?? "text-gray-400"}>{log.level}</span>
      <span className="text-cyan-400 truncate" title={log.source}>{log.source}</span>
      <span className="text-gray-300 break-words">{log.msg}</span>
    </div>
  );
}

function EventRow({ event }) {
  return (
    <div className={`grid grid-cols-[72px_52px_minmax(90px,150px)_1fr] gap-3 py-1 ${event.type === "Warning" ? "bg-amber-950/20 -mx-2 px-2 rounded" : ""}`}>
      <time className="text-gray-500">{event.ts}</time>
      <span className={event.type === "Warning" ? "text-yellow-400" : "text-violet-400"}>EVENT</span>
      <span className="text-violet-300 truncate" title={event.resource}>{event.resource}</span>
      <span className="text-gray-300 break-words"><span className="font-semibold text-gray-200">{event.reason}</span> · {event.message}</span>
    </div>
  );
}
