import { AlertTriangle, ArrowUpRight, HeartPulse, Server, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adaptIncident, formatAge, sourceLabel } from "../api/adapters";
import { getReadiness, getSystemInfo, listClusters, listIncidents } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, StaleBanner } from "../components/ui/AsyncState";
import StatusPill from "../components/ui/StatusPill";
import { useApiResource, livePollMs } from "../hooks/useApiResource";

export default function DashboardPage() {
  const navigate = useNavigate();
  const incidentsQuery = useApiResource(({ signal }) => listIncidents({}, { signal }), [], { pollMs: livePollMs });
  const readiness = useApiResource(({ signal }) => getReadiness({ signal }), [], { pollMs: livePollMs });
  const clusters = useApiResource(({ signal }) => listClusters({ signal }), []);
  const system = useApiResource(({ signal }) => getSystemInfo({ signal }), []);
  const incidents = (incidentsQuery.data ?? []).map(adaptIncident);
  const active = incidents.filter((item) => item.rawStatus !== "RESOLVED");
  const critical = active.filter((item) => item.severity === "CRITICAL");
  const health = readiness.data?.status ?? (readiness.error ? "UNHEALTHY" : "CHECKING");

  return <div className="flex flex-col flex-1">
    <TopBar breadcrumbs={["Home", "Dashboard"]} />
    <main className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-gray-900">System Dashboard</h1><p className="text-sm text-gray-500 mt-1">Live state reported by the Faultline backend.</p></div>
        <StatusPill status={health} label={health === "CHECKING" ? "Checking API" : health} />
      </div>
      <StaleBanner error={incidentsQuery.data ? incidentsQuery.error : null} onRetry={incidentsQuery.refetch} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric label="Active incidents" value={active.length} icon={AlertTriangle} tone="text-red-500 bg-red-50" />
        <Metric label="Critical incidents" value={critical.length} icon={ShieldCheck} tone="text-orange-500 bg-orange-50" />
        <Metric label="Registered clusters" value={clusters.data?.length ?? "—"} icon={Server} tone="text-blue-500 bg-blue-50" />
        <Metric label="API environment" value={system.data?.environment ?? "—"} icon={HeartPulse} tone="text-green-500 bg-green-50" />
      </div>
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"><div><h2 className="text-sm font-bold text-gray-900">Active incidents</h2><p className="text-xs text-gray-400 mt-0.5">Highest severity first, refreshed automatically</p></div><button onClick={() => navigate('/incidents')} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">View all <ArrowUpRight size={11} /></button></div>
        <AsyncSection {...incidentsQuery} onRetry={incidentsQuery.refetch} isEmpty={() => active.length === 0} emptyTitle="No active incidents" emptyHint="The backend has no open or active incidents.">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">{["Severity", "Incident", "Resource", "Source", "Age", "Status"].map((heading) => <th key={heading} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{heading}</th>)}</tr></thead><tbody>{active.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity)).slice(0, 8).map((incident) => <tr key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)} className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer"><td className="px-5 py-3"><StatusPill status={incident.severity} /></td><td className="px-5 py-3"><p className="font-semibold text-gray-900">{incident.title}</p><p className="text-xs text-gray-400 font-mono">{incident.id}</p></td><td className="px-5 py-3 text-gray-600">{incident.service}</td><td className="px-5 py-3 text-gray-500">{sourceLabel(incident.anomalies?.[0]?.source)}</td><td className="px-5 py-3 text-gray-500">{formatAge(incident.firstSeen)}</td><td className="px-5 py-3"><StatusPill status={incident.rawStatus} /></td></tr>)}</tbody></table></div>
        </AsyncSection>
      </section>
    </main>
  </div>;
}

function Metric({ label, value, icon: Icon, tone }) {
  return <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p><p className="text-3xl font-extrabold text-gray-900 mt-1 capitalize">{value}</p></div><div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}><Icon size={17} /></div></div></div>;
}

const severityWeight = (value) => ({ CRITICAL: 4, HIGH: 3, WARNING: 2, INFO: 1 })[value] ?? 0;
