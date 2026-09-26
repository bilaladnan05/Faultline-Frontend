import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle, ArrowRight, Check, CheckCircle2, CircleDot, LoaderCircle,
  Network, Server, ShieldCheck, TerminalSquare,
} from "lucide-react";
import { getClusterOnboarding, startClusterOnboarding } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";

const steps = [
  { icon: Server, title: "Register cluster", detail: "Save the cluster identity in Faultline." },
  { icon: Network, title: "Install collectors", detail: "Deploy the log and event collectors." },
  { icon: ShieldCheck, title: "Verify connection", detail: "Confirm telemetry reaches Faultline." },
];

export default function ClusterOnboardingPage({ onConnected, showSkip = true }) {
  const [clusterName, setClusterName] = useState("");
  const [controlPlaneIp, setControlPlaneIp] = useState("");
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    if (!job?.id || job.status !== "running") return undefined;
    const controller = new AbortController();
    const timer = window.setInterval(async () => {
      try {
        setJob(await getClusterOnboarding(job.id, { signal: controller.signal }));
      } catch (caught) {
        if (caught?.name !== "AbortError") setError(caught?.message || "Could not read onboarding progress.");
      }
    }, 1500);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [job?.id, job?.status]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [job?.output]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!clusterName.trim()) return setError("Enter a name for this cluster.");
    if (!controlPlaneIp.trim()) return setError("Enter the Kubernetes control-plane address.");
    setSubmitting(true);
    try {
      setJob(await startClusterOnboarding(clusterName.trim(), controlPlaneIp.trim()));
    } catch (caught) {
      setError(caught?.status === 403 ? "Only an administrator can onboard a cluster." : caught?.message || "Cluster onboarding could not be started.");
    } finally {
      setSubmitting(false);
    }
  };

  const running = job?.status === "running";
  const complete = job?.status === "succeeded";
  const failed = job?.status === "failed";

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        breadcrumbs={["Clusters", "Connect cluster"]}
        action={showSkip ? <Link to="/deployments" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50">Back to clusters</Link> : null}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <header>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Initial setup</span>
            <h1 className="mt-3 text-xl font-bold text-gray-900">Connect a Kubernetes cluster</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Faultline will install lightweight collectors into the cluster selected by your current kubectl context.</p>
          </header>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Server size={17} /></span>
                  <div><h2 className="text-sm font-bold text-gray-900">Cluster details</h2><p className="mt-0.5 text-xs text-gray-400">Enter the cluster identity and Kubernetes API address.</p></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-5">
                {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-700">Cluster name</span>
                    <input value={clusterName} onChange={(event) => setClusterName(event.target.value)} disabled={running} maxLength={63} autoComplete="off" placeholder="production-east" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50" />
                    <span className="mt-1.5 block text-xs text-gray-400">A recognizable name for dashboards and alerts.</span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-700">Kubernetes control-plane address</span>
                    <div className="relative"><CircleDot size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={controlPlaneIp} onChange={(event) => setControlPlaneIp(event.target.value)} disabled={running} inputMode="text" autoComplete="off" placeholder="127.0.0.1:6443" className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50" /></div>
                    <span className="mt-1.5 block text-xs text-gray-400">IPv4 or IPv6, with an optional API-server port.</span>
                  </label>
                </div>

                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-blue-600" /><p className="text-xs leading-5 text-blue-800">Faultline uses your current kubectl context and never asks for cluster credentials in the browser.</p></div>
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <p className="hidden text-xs text-gray-400 sm:block">You can safely retry if setup is interrupted.</p>
                  {!complete ? <button type="submit" disabled={submitting || running} className="ml-auto flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting || running ? <><LoaderCircle size={15} className="animate-spin" /> Connecting…</> : <>Connect cluster <ArrowRight size={15} /></>}</button> : onConnected ? <button type="button" onClick={onConnected} className="ml-auto flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700">Open clusters <ArrowRight size={15} /></button> : <Link to="/deployments" className="ml-auto flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700">Open clusters <ArrowRight size={15} /></Link>}
                </div>
              </form>
            </section>

            <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">What happens next</h2>
              <p className="mt-1 text-xs leading-5 text-gray-400">Setup usually takes a few minutes.</p>
              <ol className="mt-5 space-y-5">
                {steps.map(({ icon: Icon, title, detail }, index) => <li key={title} className="relative flex gap-3">{index < steps.length - 1 && <span className="absolute left-[15px] top-8 h-8 w-px bg-gray-200" />}<span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">{complete ? <Check size={14} className="text-green-600" /> : <Icon size={14} />}</span><div><p className="text-xs font-semibold text-gray-800">{index + 1}. {title}</p><p className="mt-0.5 text-xs leading-5 text-gray-400">{detail}</p></div></li>)}
              </ol>
            </aside>
          </div>

          {job && <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5"><div className="flex items-center gap-2"><TerminalSquare size={15} className="text-gray-500" /><h2 className="text-sm font-bold text-gray-900">Setup progress</h2></div><span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${complete ? "border-green-200 bg-green-50 text-green-700" : failed ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{running && <LoaderCircle size={11} className="animate-spin" />}{complete && <CheckCircle2 size={11} />}{complete ? "Connected" : failed ? "Failed" : "Running"}</span></div>
            <div ref={outputRef} className="max-h-64 min-h-28 overflow-y-auto bg-slate-950 px-5 py-4 font-mono text-xs leading-6 text-slate-400" aria-live="polite">{job.output?.length ? job.output.map((line, index) => <div key={`${index}-${line}`}>{line}</div>) : <div>Preparing onboarding command…</div>}{job.error && <div className="mt-2 text-red-400">{job.error}</div>}</div>
          </section>}
        </div>
      </main>
    </div>
  );
}
