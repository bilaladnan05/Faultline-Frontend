import { ExternalLink, MessageSquare, RefreshCw } from "lucide-react";
import { formatTimestamp } from "../../api/adapters";
import StatusPill from "../ui/StatusPill";

export default function SlackTicketStatus({ query }) {
  if (query.loading && !query.data) {
    return <div aria-label="Loading Slack ticket" className="h-28 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (query.error && !query.data) {
    return (
      <section aria-labelledby="slack-ticket-title" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 id="slack-ticket-title" className="text-sm font-bold text-gray-900">Slack Ticket</h3>
        <p className="text-xs text-gray-500 mt-2">Slack ticket status is unavailable. The incident remains usable.</p>
        <button type="button" onClick={query.refetch} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
          <RefreshCw size={11} aria-hidden="true" /> Retry
        </button>
      </section>
    );
  }

  const ticket = query.data?.ticket;
  return (
    <section aria-labelledby="slack-ticket-title" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-gray-400" aria-hidden="true" />
          <h3 id="slack-ticket-title" className="text-sm font-bold text-gray-900">Slack Ticket</h3>
        </div>
        {ticket && <StatusPill status={ticket.status} label="Linked" />}
      </div>

      {!ticket ? (
        <p className="text-xs text-gray-500 mt-3">No Slack ticket is linked to this incident.</p>
      ) : (
        <div className="mt-3 space-y-2">
          <dl className="text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400">Channel ID</dt>
              <dd className="font-mono font-semibold text-gray-700 truncate">{ticket.channelId}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 mt-1.5">
              <dt className="text-gray-400">Last updated</dt>
              <dd className="text-gray-600 text-right">{formatTimestamp(ticket.updatedAt)}</dd>
            </div>
          </dl>
          {ticket.url && (
            <a
              href={ticket.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
            >
              Open in Slack <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
