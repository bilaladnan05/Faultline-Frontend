import { useEffect, useState } from "react";
import { ExternalLink, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { formatTimestamp } from "../../api/adapters";
import { createIncidentSlackTicket } from "../../api/reporting";
import StatusPill from "../ui/StatusPill";

const LINK_POLL_ATTEMPTS = 10;
const LINK_POLL_INTERVAL_MS = 1500;

export default function SlackTicketStatus({ incidentId, query }) {
  const [requestState, setRequestState] = useState("idle");
  const [requestError, setRequestError] = useState("");
  const ticket = query.data?.ticket;
  const refetch = query.refetch;

  useEffect(() => {
    if (requestState !== "requested" || ticket) return undefined;
    let cancelled = false;
    let attempts = 0;
    let timer;

    const poll = async () => {
      attempts += 1;
      try {
        await refetch();
      } catch {
        // The resource hook exposes the request error; keep polling within the bound.
      }
      if (cancelled) return;
      if (attempts < LINK_POLL_ATTEMPTS) {
        timer = window.setTimeout(poll, LINK_POLL_INTERVAL_MS);
      } else {
        setRequestState("idle");
        setRequestError("The request was accepted, but no ticket is linked yet. Check the Slack integration and retry.");
      }
    };

    timer = window.setTimeout(poll, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [refetch, requestState, ticket]);

  const createTicket = async () => {
    if (!incidentId || requestState !== "idle") return;
    setRequestState("requesting");
    setRequestError("");
    try {
      const result = await createIncidentSlackTicket(incidentId);
      if (result.ticket) {
        await refetch();
        setRequestState("idle");
      } else {
        setRequestState("requested");
      }
    } catch (error) {
      setRequestState("idle");
      setRequestError(error?.message || "Slack ticket creation failed. Please retry.");
    }
  };

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
        <div className="mt-3">
          <p className="text-xs text-gray-500">
            No Slack ticket is linked to this incident. Automatic creation may still be processing.
          </p>
          {requestError && <p role="alert" className="text-xs text-red-600 mt-2">{requestError}</p>}
          <button
            type="button"
            onClick={createTicket}
            disabled={!incidentId || requestState !== "idle"}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {requestState === "requesting" ? (
              <><Loader2 size={12} className="animate-spin" aria-hidden="true" /> Requesting…</>
            ) : requestState === "requested" ? (
              <><Loader2 size={12} className="animate-spin" aria-hidden="true" /> Waiting for Slack…</>
            ) : (
              <><MessageSquare size={12} aria-hidden="true" /> Create Slack ticket</>
            )}
          </button>
        </div>
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
