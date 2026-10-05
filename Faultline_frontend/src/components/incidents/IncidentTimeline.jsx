import StatusPill from "../ui/StatusPill";
import { EmptyState } from "../ui/AsyncState";
import { formatTimestamp } from "../../api/adapters";

/** Shared normalized incident timeline; report and base incident entries use this shape. */
export default function IncidentTimeline({ entries }) {
  if (!entries.length) return <EmptyState title="No timeline events recorded." />;
  const visible = entries.slice(-50);
  const remaining = entries.slice(0, -50);
  return (
    <>
      {remaining.length > 0 && <details className="mb-4 ml-2 border border-gray-200 rounded-lg p-3"><summary className="text-xs font-semibold text-blue-600 cursor-pointer">Show {remaining.length} earlier timeline events</summary><div className="mt-4"><TimelineEntries entries={remaining} /></div></details>}
      <TimelineEntries entries={visible} />
    </>
  );
}

function TimelineEntries({ entries }) {
  return (
    <ol className="border-l-2 border-gray-100 ml-2">
      {entries.map((entry) => (
        <li key={entry.id} className="relative pl-5 pb-4 last:pb-0">
          <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" aria-hidden="true" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {entry.type.replace(/_/g, " ")}
            </span>
            <time className="text-[10px] text-gray-400" dateTime={entry.timestamp}>{formatTimestamp(entry.timestamp)}</time>
            <StatusPill status={entry.severity} />
          </div>
          <p className="text-sm text-gray-700 mt-1">{entry.summary}</p>
        </li>
      ))}
    </ol>
  );
}
