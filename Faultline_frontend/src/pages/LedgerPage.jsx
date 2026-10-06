import { Search } from "lucide-react";
import { useDeferredValue, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adaptIncident, classificationLabel, formatTimestamp } from "../api/adapters";
import {
  INCIDENT_CLASSIFICATIONS,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  listIncidents,
} from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import StatusPill from "../components/ui/StatusPill";
import { livePollMs, useApiResource } from "../hooks/useApiResource";

/**
 * Every incident the backend has recorded, newest first, and the console's one incidents
 * list: each row opens the incident's details page.
 *
 * Every filter is applied by the API to the persisted ledger. Filter state lives in the
 * URL so a view survives refresh and can be shared with another operator.
 */
export default function LedgerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const classification = searchParams.get("classification") ?? "";
  const severity = searchParams.get("severity") ?? "";
  const service = searchParams.get("service") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const status = searchParams.get("status") ?? "";
  const setFilter = (name, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    setSearchParams(next, { replace: true });
  };
  const deferredSearch = useDeferredValue(search.trim());
  const deferredService = useDeferredValue(service.trim());
  const query = useApiResource(
    ({ signal }) =>
      listIncidents(
        {
          search: deferredSearch,
          classification,
          severity,
          service: deferredService,
          from: localInstant(from),
          to: localInstant(to),
          status,
        },
        { signal },
      ),
    [deferredSearch, classification, severity, deferredService, from, to, status],
    { pollMs: livePollMs },
  );

  const entries = useMemo(
    () =>
      (query.data ?? [])
        .map(adaptIncident)
        .sort((a, b) => Date.parse(b.firstSeen) - Date.parse(a.firstSeen)),
    [query.data],
  );

  const filtered = Boolean(search.trim() || classification || severity || service.trim() || from || to || status);
  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Incident Ledger"]} />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Incident Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Every incident persisted by the backend, newest first. Select one to open its details.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <label className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Search ID, title, type, service…"
              aria-label="Search incidents"
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-64"
            />
          </label>
          <select
            aria-label="Filter by incident type"
            value={classification}
            onChange={(event) => setFilter("classification", event.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">All incident types</option>
            {INCIDENT_CLASSIFICATIONS.map((value) => (
              <option key={value} value={value}>{classificationLabel(value)}</option>
            ))}
          </select>
          <select
            aria-label="Filter by severity"
            value={severity}
            onChange={(event) => setFilter("severity", event.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">All severities</option>
            {INCIDENT_SEVERITIES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <input
            aria-label="Filter by affected service"
            value={service}
            onChange={(event) => setFilter("service", event.target.value)}
            placeholder="Affected service"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-44"
          />
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            From
            <input
              type="datetime-local"
              aria-label="Detected from"
              value={from}
              onChange={(event) => setFilter("from", event.target.value)}
              className="px-2 py-2 text-sm font-normal border border-gray-200 rounded-lg"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            To
            <input
              type="datetime-local"
              aria-label="Detected to"
              value={to}
              onChange={(event) => setFilter("to", event.target.value)}
              className="px-2 py-2 text-sm font-normal border border-gray-200 rounded-lg"
            />
          </label>
          <select
            aria-label="Filter by resolution status"
            value={status}
            onChange={(event) => setFilter("status", event.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">All resolution statuses</option>
            {INCIDENT_STATUSES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          {filtered && (
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-blue-600 hover:underline">
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-gray-500">
            {entries.length} result{entries.length === 1 ? "" : "s"}
          </span>
        </div>

        <StaleBanner error={query.data ? query.error : null} onRetry={query.refetch} />

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <AsyncSection
            {...query}
            data={query.data ? entries : null}
            onRetry={query.refetch}
            isEmpty={(items) => items.length === 0}
            emptyTitle={filtered ? "No incidents match these filters" : "The incident ledger is empty"}
            emptyHint={
              filtered
                ? "Try changing the filters."
                : "Incidents appear here once the processor correlates telemetry into one."
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    {["Detected", "Incident", "Type", "Affected service", "Cluster", "Severity", "Status", "Correlation key"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      onClick={() => navigate(`/incidents/${encodeURIComponent(entry.id)}`)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(entry.firstSeen)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900">{entry.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 max-w-md line-clamp-2" title={entry.reasonSummary}>
                          {entry.reasonSummary}
                        </p>
                        <p className="font-mono text-xs text-gray-400">{entry.id}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{entry.classificationLabel}</td>
                      <td className="px-5 py-3 text-gray-600">{entry.service}</td>
                      <td className="px-5 py-3 text-gray-600">{entry.clusterId}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={entry.severity} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={entry.rawStatus} />
                      </td>
                      <td
                        className="px-5 py-3 font-mono text-xs text-gray-400 max-w-56 truncate"
                        title={entry.correlationKey}
                      >
                        {entry.correlationKey}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AsyncSection>
        </section>
      </main>
    </div>
  );
}

function localInstant(value) {
  if (!value) return undefined;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? undefined : timestamp.toISOString();
}
