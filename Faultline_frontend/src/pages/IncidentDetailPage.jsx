import { ArrowLeft, FileText, ListTree, Radio } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adaptIncident, classificationLabel, formatTimestamp, resourceLabel } from "../api/adapters";
import { getIncident, getIncidentEvidence } from "../api/endpoints";
import IncidentHeader from "../components/incidents/IncidentHeader";
import IncidentTechnicalReport from "../components/incidents/IncidentTechnicalReport";
import SlackTicketStatus from "../components/incidents/SlackTicketStatus";
import TopBar from "../components/layout/TopBar";
import { AsyncSection, EmptyState } from "../components/ui/AsyncState";
import StatusPill from "../components/ui/StatusPill";
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
    <TopBar breadcrumbs={["Incidents", id ?? "Detail"]} />
    <main className="flex-1 overflow-y-auto p-6 space-y-5">
      <button onClick={() => navigate('/incidents')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"><ArrowLeft size={14} /> Back to incidents</button>
      <AsyncSection {...incidentQuery} data={incident} onRetry={incidentQuery.refetch} loadingLabel="Loading incident…">
        {incident && <>
          <IncidentHeader incident={incident} report={reportQuery.data} />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                <Tab active={tab === 'evidence'} onClick={() => setTab('evidence')} icon={Radio}>Evidence</Tab>
                <Tab active={tab === 'timeline'} onClick={() => setTab('timeline')} icon={ListTree}>Lifecycle</Tab>
                <Tab active={tab === 'report'} onClick={() => setTab('report')} icon={FileText}>Technical report</Tab>
              </div>
              <div className="p-5">
                {tab === 'evidence' && <EvidencePanel query={evidenceQuery} />}
                {tab === 'timeline' && <Lifecycle incident={incident} />}
                {tab === 'report' && <IncidentTechnicalReport query={reportQuery} incidentId={id} />}
              </div>
            </section>
            <aside className="space-y-4">
              <SlackTicketStatus query={slackQuery} />
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

function EvidencePanel({ query }) {
  const payload = query.data;
  const anomalyEvidence = payload?.anomalyEvidence ?? payload?.evidence ?? payload?.anomalies ?? [];
  const logs = payload?.telemetry?.errorLogs ?? payload?.telemetry?.logs ?? payload?.logs ?? [];
  const events = payload?.telemetry?.kubernetesEvents ?? payload?.kubernetesEvents ?? payload?.events ?? [];
  return <AsyncSection {...query} onRetry={query.refetch} isEmpty={() => anomalyEvidence.length + logs.length + events.length === 0} emptyTitle="No evidence in this incident window">
    <div className="space-y-5">
      <EvidenceList title="Anomaly evidence" items={anomalyEvidence} render={(item) => <><div className="flex gap-2 items-center"><StatusPill status={item.severity} /><span className="text-xs font-semibold text-gray-700">{classificationLabel(item.classification)}</span></div><p className="text-sm text-gray-600 mt-1">{item.summary ?? item.message ?? 'Evidence recorded by the processor.'}</p><p className="text-[10px] text-gray-400 mt-1">{formatTimestamp(item.timestamp ?? item.eventTimestamp)} · {resourceLabel(item.affectedResource ?? item.resource)}</p></>} />
      <EvidenceList title="Logs" items={logs} render={(item) => <><p className="text-xs font-mono text-gray-400">{formatTimestamp(item.eventTimestamp)} · {item.severity}</p><p className="text-sm font-mono text-gray-700 break-words mt-1">{item.message}</p></>} />
      <EvidenceList title="Kubernetes events" items={events} render={(item) => <><p className="text-xs font-semibold text-gray-700">{item.reason ?? item.type}</p><p className="text-sm text-gray-600 mt-1">{item.message}</p></>} />
    </div>
  </AsyncSection>;
}

function EvidenceList({ title, items, render }) {
  if (!items.length) return null;
  return <section><h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title} ({items.length})</h3><div className="space-y-2">{items.slice(0, 100).map((item, index) => <article key={item.id ?? item.eventId ?? index} className="border border-gray-200 rounded-lg p-3">{render(item)}</article>)}</div></section>;
}

function Lifecycle({ incident }) {
  if (!incident.progress.length) return <EmptyState title="No lifecycle data recorded." />;
  return <ol className="space-y-3">{incident.progress.map((step) => <li key={step.label} className="flex items-center gap-3"><span className={`w-3 h-3 rounded-full ${step.done ? 'bg-blue-500' : 'bg-gray-200'}`} /><div><p className={`text-sm font-semibold ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>{step.at && <p className="text-xs text-gray-400">{formatTimestamp(step.at)}</p>}</div></li>)}</ol>;
}
