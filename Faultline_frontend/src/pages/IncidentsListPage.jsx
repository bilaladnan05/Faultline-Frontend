import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adaptIncident, severityRank } from "../api/adapters";
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES, listIncidents } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import StatusPill from "../components/ui/StatusPill";
import { livePollMs, useApiResource } from "../hooks/useApiResource";

export default function IncidentsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const query = useApiResource(({ signal }) => listIncidents({ severity, status }, { signal }), [severity, status], { pollMs: livePollMs });
  const incidents = useMemo(() => (query.data ?? []).map(adaptIncident).filter((item) => {
    const term = search.trim().toLowerCase();
    return !term || [item.id, item.title, item.summary, item.service, item.clusterId].some((value) => String(value ?? "").toLowerCase().includes(term));
  }).sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || Date.parse(b.lastSeen) - Date.parse(a.lastSeen)), [query.data, search]);

  return <div className="flex flex-col flex-1">
    <TopBar breadcrumbs={["Incidents"]} />
    <main className="flex-1 overflow-y-auto p-6 space-y-5">
      <div><h1 className="text-xl font-bold text-gray-900">Incidents</h1><p className="text-sm text-gray-500 mt-1">Correlated incidents returned by the backend.</p></div>
      <div className="flex gap-3 flex-wrap">
        <label className="relative"><Search size={14} className="absolute left-3 top-2.5 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search incidents" className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-64" /></label>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="">All statuses</option>{INCIDENT_STATUSES.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Filter by severity" value={severity} onChange={(event) => setSeverity(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="">All severities</option>{INCIDENT_SEVERITIES.map((value) => <option key={value}>{value}</option>)}</select>
        <span className="ml-auto self-center text-xs text-gray-500">{incidents.length} result{incidents.length === 1 ? "" : "s"}</span>
      </div>
      <StaleBanner error={query.data ? query.error : null} onRetry={query.refetch} />
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <AsyncSection {...query} data={query.data ? incidents : null} onRetry={query.refetch} isEmpty={(items) => items.length === 0} emptyTitle="No incidents found" emptyHint="Try changing the filters, or wait for the processor to correlate new telemetry.">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">{["ID", "Summary", "Severity", "Status", "Resource", "Cluster", "Confidence"].map((heading) => <th key={heading} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{heading}</th>)}</tr></thead><tbody>{incidents.map((incident) => <tr key={incident.id} onClick={() => navigate(`/incidents/${encodeURIComponent(incident.id)}`)} className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer"><td className="px-5 py-4 text-xs font-mono text-gray-500">{incident.id}</td><td className="px-5 py-4 max-w-md"><p className="font-semibold text-gray-900">{incident.title}</p><p className="text-xs text-gray-400 mt-0.5 truncate">{incident.summary}</p></td><td className="px-5 py-4"><StatusPill status={incident.severity} /></td><td className="px-5 py-4"><StatusPill status={incident.rawStatus} /></td><td className="px-5 py-4 text-gray-700">{incident.service}</td><td className="px-5 py-4 text-gray-500">{incident.clusterId}</td><td className="px-5 py-4 font-semibold text-gray-700">{incident.confidence}%</td></tr>)}</tbody></table></div>
        </AsyncSection>
      </section>
    </main>
  </div>;
}
