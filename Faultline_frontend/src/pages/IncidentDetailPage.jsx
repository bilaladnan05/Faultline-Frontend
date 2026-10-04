import { ArrowLeft, FileText, Radio } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adaptIncident } from "../api/adapters";
import { getIncident, getIncidentEvidence } from "../api/endpoints";
import IncidentEvidencePanel from "../components/incidents/IncidentEvidencePanel";
import IncidentHeader from "../components/incidents/IncidentHeader";
import IncidentTechnicalReport from "../components/incidents/IncidentTechnicalReport";
import SlackTicketStatus from "../components/incidents/SlackTicketStatus";
import TopBar from "../components/layout/TopBar";
import { AsyncSection } from "../components/ui/AsyncState";
import { useApiResource } from "../hooks/useApiResource";
import { useIncidentReport, useIncidentSlackTicket } from "../hooks/useReporting";

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("evidence");
  const incidentQuery = useApiResource(({ signal }) => getIncident(id, { signal }), [id], { enabled: Boolean(id) });
  const evidenceQuery = useApiResource(({ signal }) => getIncidentEvidence(id, {}, { signal }), [id], { enabled: Boolean(id) });
  const reportQuery = useIncidentReport(id);
  const slackQuery = useIncidentSlackTicket(id);
  const incident = adaptIncident(incidentQuery.data);

  return <div className="flex flex-col flex-1">
    <TopBar breadcrumbs={["Incident Ledger", id ?? "Detail"]} />
    <main className="flex-1 overflow-y-auto p-6 space-y-5">
      <button onClick={() => navigate('/ledger')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"><ArrowLeft size={14} /> Back to incident ledger</button>
      <AsyncSection {...incidentQuery} data={incident} onRetry={incidentQuery.refetch} loadingLabel="Loading incident…">
        {incident && <>
          <IncidentHeader incident={incident} report={reportQuery.data} />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                <Tab active={tab === 'evidence'} onClick={() => setTab('evidence')} icon={Radio}>Evidence</Tab>
                <Tab active={tab === 'report'} onClick={() => setTab('report')} icon={FileText}>Technical report</Tab>
              </div>
              <div className="p-5">
                {tab === 'evidence' && <IncidentEvidencePanel query={evidenceQuery} incident={incident} />}
                {tab === 'report' && <IncidentTechnicalReport query={reportQuery} incidentId={id} />}
              </div>
            </section>
            <aside className="space-y-4">
              <SlackTicketStatus incidentId={id} query={slackQuery} />
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"><h2 className="text-sm font-bold text-gray-900 mb-3">Affected resources</h2>{incident.affectedAssets.length === 0 ? <p className="text-xs text-gray-500">No resources recorded.</p> : <ul className="space-y-2">{incident.affectedAssets.map((asset, index) => <li key={`${asset.name}-${index}`} className="border border-gray-100 bg-gray-50 rounded-lg px-3 py-2"><p className="text-sm font-semibold text-gray-800">{asset.name}</p><p className="text-[10px] uppercase text-gray-400">{asset.scope}{asset.namespace ? ` · ${asset.namespace}` : ''}</p></li>)}</ul>}</section>
            </aside>
          </div>
        </>}
      </AsyncSection>
    </main>
  </div>;
}

function Tab({ active, onClick, icon: Icon, children }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 ${active ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500'}`}><Icon size={14} />{children}</button>;
}
