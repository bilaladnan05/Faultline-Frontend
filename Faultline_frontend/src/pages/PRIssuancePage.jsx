import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, CheckCircle2, Loader2, Clock, GitPullRequest } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { useApiResource } from "../hooks/useApiResource";
import { getIncident } from "../api/endpoints";
import { adaptIncident } from "../api/adapters";
import { showToast } from "../utils/toast";

const diffLines = [
  { type: "ctx", file: "src/dbClient.ts", line: 45, code: "  const poolConfig = {" },
  { type: "remove", file: "src/dbClient.ts", line: 46, code: "    timeout: 0," },
  { type: "add", file: "src/dbClient.ts", line: 46, code: "    timeout: 5000," },
  { type: "add", file: "src/dbClient.ts", line: 47, code: "    // Added exponential backoff for DB retries" },
  { type: "ctx", file: "src/dbClient.ts", line: 48, code: "    maxPoolSize: 20," },
  { type: "remove", file: "src/dbClient.ts", line: 49, code: "  };" },
  { type: "add", file: "src/dbClient.ts", line: 49, code: "    retryStrategy: 'exponential_backoff'," },
  { type: "add", file: "src/dbClient.ts", line: 50, code: "  };" },
];

const validationChecks = [
  { label: "Static Analysis", status: "passed", desc: "Linting and security scan — 0 vulnerabilities found.", fr: "FR-02" },
  { label: "CI Checks", status: "running", desc: "Running 5/8 integration tests (FTs 3-5a, 5b).", fr: "FR-03" },
  { label: "Staging Deployment", status: "pending", desc: "Awaiting CI completion before staging deploy.", fr: "FR-03" },
];

const statusStyles = {
  passed: { pill: "bg-green-50 text-green-600 border border-green-200", icon: CheckCircle2, iconClass: "text-green-500" },
  running: { pill: "bg-yellow-50 text-yellow-700 border border-yellow-200", icon: Loader2, iconClass: "text-yellow-500 animate-spin" },
  pending: { pill: "bg-gray-100 text-gray-500 border border-gray-200", icon: Clock, iconClass: "text-gray-400" },
};

export default function PRIssuancePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // The incident context is real; the suggested diff and validation checks below are
  // not — the API exposes no code-fix or CI endpoints, so they stay illustrative.
  const incidentQuery = useApiResource(({ signal }) => getIncident(id, { signal }), [id]);
  const incident = useMemo(() => adaptIncident(incidentQuery.data), [incidentQuery.data]);

  const [prTitle, setPrTitle] = useState("fix(db): implement connection timeout and backoff strategy");
  const desc = incident
    ? `Automated fix for incident ${incident.id} (${incident.classificationLabel}) on ${incident.service} in ${incident.clusterId}. ${incident.summary}`
    : `Automated fix for incident ${id}.`;

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Incidents", (id ?? "").slice(0, 8), "PR Issuance"]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/incidents/${encodeURIComponent(id)}`)}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-1.5 rounded-lg"
            >
              Discard Draft
            </button>
            <button
              onClick={() => { showToast("PR submitted to GitHub successfully!"); navigate(`/incidents/${encodeURIComponent(id)}`); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              <GitPullRequest size={14} />
              Submit PR to GitHub
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <button onClick={() => navigate(`/incidents/${encodeURIComponent(id)}`)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
          <ArrowLeft size={14} /> Back to Incident
        </button>

        <div>
          <h1 className="text-xl font-bold text-gray-900">PR Issuance &amp; Validation</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            Triggered from incident{" "}
            <span className="font-bold text-gray-800 font-mono">{(incident?.id ?? id).slice(0, 8)}</span>
            {incident ? ` · ${incident.title}` : incidentQuery.error ? " · incident could not be loaded" : " · loading…"}
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 inline-block">
            The incident context above is live. The suggested diff, validation checks and PR submission below are not
            backed by the API yet.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 items-start">
          {/* Left: Code + PR form */}
          <div className="col-span-2 space-y-4">
            {/* AI Code Fix — FR-01, FR-02, FR-03 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-orange-500" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">AI-Suggested Code Fix</h2>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">FR-01 · FR-02</span>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">HIGH CONFIDENCE</span>
              </div>

              {/* Diff header */}
              <div className="grid grid-cols-[2fr,60px,3fr] px-5 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <span>File Path</span>
                <span>Line</span>
                <span>Changes</span>
              </div>

              <div className="font-mono text-[12.5px]">
                {diffLines.map((l, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[2fr,60px,3fr] px-5 py-1.5 border-b border-gray-50 ${l.type === "add" ? "bg-green-50" : l.type === "remove" ? "bg-red-50" : "bg-white"}`}
                  >
                    <span className="text-gray-400 text-[11px] truncate">{l.file}</span>
                    <span className="text-gray-300 text-center">{l.line}</span>
                    <span className={l.type === "add" ? "text-green-700" : l.type === "remove" ? "text-red-600" : "text-gray-500"}>
                      {l.type === "add" ? <span className="font-bold text-green-600 mr-2">+</span> : l.type === "remove" ? <span className="font-bold text-red-500 mr-2">-</span> : <span className="mr-2 text-gray-300"> </span>}
                      {l.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PR Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                  <GitPullRequest size={14} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Pull Request Details</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">PR Title</label>
                  <input
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  {/* key remounts the field once the incident resolves, so the draft
                      description reflects the real incident rather than a placeholder. */}
                  <textarea key={desc} defaultValue={desc} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reviewers</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">
                        <span className="w-4 h-4 bg-blue-600 rounded-full text-white text-[8px] font-bold flex items-center justify-center">JD</span>
                        @jdoe_eng
                      </span>
                      <button className="border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 rounded-full px-3 py-1 text-xs">+ Add</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Labels</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["bug", "automated-fix", "hotfix"].map((l, i) => (
                        <span key={l} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${i === 0 ? "bg-red-50 text-red-600" : i === 1 ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Validation */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Validation Checks</h3>
              <div className="space-y-3">
                {validationChecks.map((c) => {
                  const s = statusStyles[c.status];
                  return (
                    <div key={c.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 font-medium">{c.label}</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase ${s.pill}`}>{c.status}</span>
                          <span className="text-[9px] text-gray-400 font-bold">{c.fr}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400">{c.desc}</p>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${c.status === "passed" ? "bg-green-500 w-full" : c.status === "running" ? "bg-yellow-400 w-5/8 animate-pulse" : "bg-gray-200 w-0"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 text-xs">i</span>
                Next Steps
              </h3>
              <ol className="space-y-2.5 list-none">
                {[
                  "Wait for all automated CI checks to complete successfully.",
                  "Verify the generated PR title and description accurately capture the fix.",
                  "Click \"Submit PR\" to create the pull request on your repository.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-gray-600 leading-relaxed">
                    <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[10px] mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
