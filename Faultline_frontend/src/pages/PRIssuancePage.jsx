import { ArrowLeft, GitPullRequest, Info } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { adaptIncident } from "../api/adapters";
import { getIncident } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import { AsyncSection } from "../components/ui/AsyncState";
import StatusPill from "../components/ui/StatusPill";
import { useApiResource } from "../hooks/useApiResource";

export default function PRIssuancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useApiResource(({ signal }) => getIncident(id, { signal }), [id], { enabled: Boolean(id) });
  const incident = adaptIncident(query.data);
  return <div className="flex flex-col flex-1"><TopBar breadcrumbs={["Incidents", id ?? "", "Remediation"]} /><main className="flex-1 overflow-y-auto p-6 space-y-5"><button onClick={() => navigate(`/incidents/${encodeURIComponent(id)}`)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><ArrowLeft size={14} />Back to incident</button><AsyncSection {...query} data={incident} onRetry={query.refetch}>{incident && <><section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"><div className="flex items-start gap-4"><div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><GitPullRequest size={19} /></div><div><div className="flex items-center gap-2 flex-wrap"><h1 className="text-xl font-bold text-gray-900">Remediation for {incident.id}</h1><StatusPill status={incident.severity} /></div><p className="text-sm text-gray-600 mt-2">{incident.title}</p><p className="text-xs text-gray-400 mt-1">{incident.clusterId} · {incident.service}</p></div></div></section><section className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3"><Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" /><div><h2 className="text-sm font-bold text-amber-900">Pull-request creation is not available in the backend</h2><p className="text-sm text-amber-800 mt-1 leading-relaxed">Faultline currently exposes incident investigation, reporting, telemetry, and notification APIs, but no repository or pull-request endpoint. This screen intentionally does not generate a fake diff or pretend to submit a PR.</p></div></section></>}</AsyncSection></main></div>;
}
