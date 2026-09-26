import { useNavigate } from "react-router-dom";
import { adaptIncident, formatTimestamp } from "../api/adapters";
import { listIncidents } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import { AsyncSection } from "../components/ui/AsyncState";
import StatusPill from "../components/ui/StatusPill";
import { useApiResource } from "../hooks/useApiResource";

export default function LedgerPage() {
  const navigate = useNavigate();
  const query = useApiResource(({ signal }) => listIncidents({}, { signal }), []);
  const entries = (query.data ?? []).map(adaptIncident).sort((a, b) => Date.parse(b.firstSeen) - Date.parse(a.firstSeen));
  return <div className="flex flex-col flex-1"><TopBar breadcrumbs={["Incident Ledger"]} /><main className="flex-1 overflow-y-auto p-6 space-y-5"><div><h1 className="text-xl font-bold text-gray-900">Incident Ledger</h1><p className="text-sm text-gray-500 mt-1">An immutable-style view of incident records persisted by the backend.</p></div><section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"><AsyncSection {...query} data={query.data ? entries : null} onRetry={query.refetch} isEmpty={(items) => items.length === 0} emptyTitle="The incident ledger is empty"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50/50 border-b border-gray-100">{["Detected", "Incident", "Classification", "Cluster", "Severity", "Status", "Correlation key"].map((heading) => <th key={heading} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{heading}</th>)}</tr></thead><tbody>{entries.map((entry) => <tr key={entry.id} onClick={() => navigate(`/incidents/${encodeURIComponent(entry.id)}`)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"><td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatTimestamp(entry.firstSeen)}</td><td className="px-5 py-3"><p className="font-semibold text-gray-900">{entry.title}</p><p className="font-mono text-xs text-gray-400">{entry.id}</p></td><td className="px-5 py-3 text-gray-600">{entry.classificationLabel}</td><td className="px-5 py-3 text-gray-600">{entry.clusterId}</td><td className="px-5 py-3"><StatusPill status={entry.severity} /></td><td className="px-5 py-3"><StatusPill status={entry.rawStatus} /></td><td className="px-5 py-3 font-mono text-xs text-gray-400 max-w-56 truncate" title={entry.correlationKey}>{entry.correlationKey}</td></tr>)}</tbody></table></div></AsyncSection></section></main></div>;
}
