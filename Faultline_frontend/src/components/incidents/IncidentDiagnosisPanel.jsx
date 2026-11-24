import { useState } from "react";
import { AlertTriangle, BrainCircuit, ExternalLink, FlaskConical, RefreshCw } from "lucide-react";
import { getIncidentCitation, investigateIncident, runDiagnosticTest } from "../../api/endpoints";
import { formatTimestamp } from "../../api/adapters";

const failureText = {
  provider_unavailable: "HolmesGPT is unavailable. The incident and evidence remain usable; retry manually when the provider is ready.",
  provider_invalid: "The provider returned an invalid diagnosis. It has not been treated as authoritative.",
};

export default function IncidentDiagnosisPanel({ evidence, contextQuery, context }) {
  const [diagnosis, setDiagnosis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [citation, setCitation] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const scope = context?.scope;
  if (contextQuery?.loading && !context) return <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">Loading the exact diagnosis context…</section>;
  if (contextQuery?.error && !context) return <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Diagnosis context is unavailable</p><p className="mt-1 text-xs">{contextQuery.error.message || "The backend did not return a diagnosis context."}</p><button type="button" onClick={contextQuery.refetch} className="mt-2 text-xs font-semibold underline">Retry</button></section>;
  if (!scope?.projectId || !scope?.incidentRevisionId || !scope?.evidenceSnapshotId) {
    return <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Diagnosis context is not available yet</p><p className="mt-1 text-xs leading-relaxed">The backend must provide the exact project, revision, and evidence snapshot identifiers before a diagnosis can be requested. No inferred or synthetic diagnosis is shown.</p></section>;
  }

  const run = async () => {
    setBusy(true); setMessage(null);
    try {
      const result = await investigateIncident(scope);
      setDiagnosis(result);
      if (result.status === "failure") setMessage(failureText[result.state] ?? "Diagnosis was not authoritative.");
    } catch (error) {
      setDiagnosis(null); setMessage(error.status === 503 ? failureText.provider_unavailable : error.message || "Diagnosis could not be requested.");
    } finally { setBusy(false); }
  };

  const openCitation = async (citationId) => {
    try { setCitation(await getIncidentCitation(scope, citationId)); }
    catch (error) { setMessage(error.message || "Citation detail is unavailable."); }
  };

  const runTest = async () => {
    setBusy(true);
    try { setTestResult(await runDiagnosticTest(scope, { testId: "kubectl_read", request: "Read the bounded evidence context for this incident." })); }
    catch (error) { setMessage(error.message || "Read-only diagnostic test unavailable."); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4"><div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4"><BrainCircuit size={18} className="mt-0.5 text-indigo-600" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-indigo-950">Evidence-grounded diagnosis</p><p className="mt-1 text-xs text-indigo-800">Revision <code>{scope.incidentRevisionId}</code> · snapshot <code>{scope.evidenceSnapshotId}</code></p></div><button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-indigo-300"><RefreshCw size={13} className={busy ? "animate-spin" : ""} />{busy ? "Investigating…" : "Investigate"}</button></div>{message && <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{message}</span></div>}{diagnosis?.status === "success" && <DiagnosisResult result={diagnosis} onCitation={openCitation} />}{citation && <CitationDetail citation={citation} onClose={() => setCitation(null)} />}<div className="rounded-lg border border-gray-200 bg-white p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-gray-800">Reviewed read-only test</p><p className="mt-1 text-xs text-gray-500">Runs bounded Kubernetes reads only; no mutation, Secret, or admin access.</p></div><button type="button" onClick={runTest} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"><FlaskConical size={13} />Run test</button></div>{testResult && <p className="mt-3 text-xs text-green-700">Bounded evidence returned from {testResult.toolId ?? "read-only test"}.</p>}</div>{evidence?.partialHistory && <p className="text-[11px] text-gray-500">History availability: {Object.entries(evidence.partialHistory).map(([key, value]) => `${key} ${value}`).join(" · ")}</p>}</div>;
}

function DiagnosisResult({ result, onCitation }) { return <section className="space-y-3 rounded-lg border border-green-200 bg-green-50/40 p-4"><div><p className="text-sm font-bold text-green-950">Authoritative diagnosis</p><p className="mt-1 text-xs text-green-800">Validated for this exact revision and snapshot. Missing evidence: {result.missingEvidence?.length ? result.missingEvidence.join("; ") : "none reported"}</p></div>{result.hypotheses?.map((hypothesis) => <article key={hypothesis.id} className="rounded-lg border border-white bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-gray-900">#{hypothesis.rank} {hypothesis.summary}</p><span className="text-xs font-bold text-indigo-700">{Math.round(hypothesis.confidence * 100)}%</span></div><div className="mt-2 flex flex-wrap gap-1">{[...hypothesis.supportingEvidenceIds, ...hypothesis.contradictingEvidenceIds].map((id) => <button type="button" key={id} onClick={() => onCitation(id)} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-mono text-gray-600 hover:bg-indigo-100"><ExternalLink size={10} />{id}</button>)}</div></article>)}<p className="text-xs italic text-gray-600">Uncertainty: {result.uncertainty}</p></section>; }
function CitationDetail({ citation, onClose }) { return <section className="rounded-lg border border-blue-200 bg-blue-50 p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold text-blue-950">Bounded citation: {citation.citationId}</p><button type="button" onClick={onClose} className="text-xs font-semibold text-blue-700 hover:underline">Close</button></div><p className="mt-2 text-sm text-blue-900">{citation.excerpt}</p><p className="mt-2 text-[11px] text-blue-700">{citation.source?.name} · event {formatTimestamp(citation.eventTime)} · captured {formatTimestamp(citation.capturedAt)}</p></section>; }
