import { useEffect, useRef, useState } from "react";
import {
  AlertCircle, ArrowRight, CheckCircle2, CircleDot, LoaderCircle,
  Network, Server, ShieldCheck, TerminalSquare,
} from "lucide-react";
import { getClusterOnboarding, startClusterOnboarding } from "../../api/endpoints";
import { showToast } from "../../utils/toast";

const steps = [
  { icon: Server, title: "Register cluster", detail: "Save the cluster identity in Faultline." },
  { icon: Network, title: "Install collectors", detail: "Deploy the log and event collectors." },
  { icon: ShieldCheck, title: "Verify connection", detail: "Confirm telemetry reaches Faultline." },
];

export default function ClusterOnboardingForm({ onSuccess }) {
  const [clusterName, setClusterName] = useState("");
  const [controlPlaneIp, setControlPlaneIp] = useState("");
  const [ingestionEndpoint, setIngestionEndpoint] = useState(() => {
    const hostname = window.location.hostname;
    return hostname && !["localhost", "127.0.0.1", "::1"].includes(hostname)
      ? `http://${hostname}:3001`
      : "";
  });
  const [kubeconfig, setKubeconfig] = useState("");
  const [kubeconfigName, setKubeconfigName] = useState("");
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const outputRef = useRef(null);
  const kubeconfigInputRef = useRef(null);

  useEffect(() => {
    if (!job?.id || job.status !== "running") return undefined;
    const controller = new AbortController();
    const timer = window.setInterval(async () => {
      try {
        const next = await getClusterOnboarding(job.id, { signal: controller.signal });
        if (next.status === "succeeded") {
          const message = `${next.clusterName || "Cluster"} was onboarded successfully. You can add another cluster.`;
          setClusterName("");
          setControlPlaneIp("");
          setIngestionEndpoint("");
          setKubeconfig("");
          setKubeconfigName("");
          if (kubeconfigInputRef.current) kubeconfigInputRef.current.value = "";
          setJob(null);
          setSuccessMessage(message);
          showToast(message);
          onSuccess?.(next);
          return;
        }
        setJob(next);
      } catch (caught) {
        if (caught?.name !== "AbortError") setError(caught?.message || "Could not read onboarding progress.");
      }
    }, 1500);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [job?.id, job?.status, onSuccess]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [job?.output]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!clusterName.trim()) return setError("Enter a name for this cluster.");
    if (!ingestionEndpoint.trim()) return setError("Enter the Faultline ingestion address reachable from the cluster.");
    if (!kubeconfig) return setError("Select the kubeconfig exported by the BookNest machine.");
    setSubmitting(true);
    try {
      setJob(await startClusterOnboarding(clusterName.trim(), controlPlaneIp.trim(), ingestionEndpoint.trim(), kubeconfig));
    } catch (caught) {
      // A plan refusal (cluster allowance used) carries its own explanation and the tier
      // that lifts it; any other 403 is the role check.
      setError(
        caught?.status === 403 && !caught?.body?.requiredPlan
          ? "Only an administrator can onboard a cluster."
          : caught?.message || "Cluster onboarding could not be started.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const running = job?.status === "running";
  const failed = job?.status === "failed";

  return <div className="space-y-5">
    {successMessage && <div role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /><span>{successMessage}</span></div>}

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
              <span className="mb-1.5 block text-xs font-semibold text-gray-700">Kubernetes control-plane address <span className="font-normal text-gray-400">(optional)</span></span>
              <div className="relative"><CircleDot size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={controlPlaneIp} onChange={(event) => setControlPlaneIp(event.target.value)} disabled={running} inputMode="text" autoComplete="off" placeholder="Use imported kubeconfig" className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50" /></div>
              <span className="mt-1.5 block text-xs text-gray-400">Leave blank to use the API address from the imported kubeconfig.</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-gray-700">Faultline ingestion address</span>
              <div className="relative"><Network size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={ingestionEndpoint} onChange={(event) => setIngestionEndpoint(event.target.value)} disabled={running} inputMode="url" autoComplete="off" placeholder="http://192.168.18.40:3001" className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50" /></div>
              <span className="mt-1.5 block text-xs text-gray-400">Use the Faultline machine LAN address; Kubernetes pods cannot use localhost.</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-gray-700">Cluster access file</span>
              <input
                ref={kubeconfigInputRef}
                type="file"
                accept=".yaml,.yml,application/yaml,text/yaml,text/plain"
                disabled={running}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  setError("");
                  if (file && file.size > 64 * 1024) {
                    setKubeconfig("");
                    setKubeconfigName("");
                    event.target.value = "";
                    setError("The kubeconfig is larger than the 64 KB limit.");
                    return;
                  }
                  setKubeconfigName(file?.name || "");
                  setKubeconfig(file ? await file.text() : "");
                }}
                className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:bg-gray-50"
              />
              <span className="mt-1.5 block text-xs text-gray-400">Select <span className="font-mono">booknest-faultline-kubeconfig.yaml</span>{kubeconfigName ? ` (${kubeconfigName})` : ""}. It is sent only to your authenticated Faultline API and stored privately.</span>
            </label>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-blue-600" /><p className="text-xs leading-5 text-blue-800">Faultline accepts only an embedded-certificate kubeconfig. Executable plugins, external credential files, proxy settings, and disabled TLS verification are rejected.</p></div>
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="hidden text-xs text-gray-400 sm:block">After completion, the form resets so you can onboard another cluster.</p>
            <button type="submit" disabled={submitting || running} className="ml-auto flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting || running ? <><LoaderCircle size={15} className="animate-spin" /> Connecting…</> : <>Connect cluster <ArrowRight size={15} /></>}</button>
          </div>
        </form>
      </section>

      <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">What happens next</h2>
        <p className="mt-1 text-xs leading-5 text-gray-400">Setup usually takes a few minutes.</p>
        <ol className="mt-5 space-y-5">
          {steps.map(({ icon: Icon, title, detail }, index) => <li key={title} className="relative flex gap-3">{index < steps.length - 1 && <span className="absolute left-[15px] top-8 h-8 w-px bg-gray-200" />}<span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500"><Icon size={14} /></span><div><p className="text-xs font-semibold text-gray-800">{index + 1}. {title}</p><p className="mt-0.5 text-xs leading-5 text-gray-400">{detail}</p></div></li>)}
        </ol>
      </aside>
    </div>

    {job && <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5"><div className="flex items-center gap-2"><TerminalSquare size={15} className="text-gray-500" /><h2 className="text-sm font-bold text-gray-900">Setup progress</h2></div><span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${failed ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{running && <LoaderCircle size={11} className="animate-spin" />}{failed ? "Failed" : "Running"}</span></div>
      <div ref={outputRef} className="max-h-64 min-h-28 overflow-y-auto bg-slate-950 px-5 py-4 font-mono text-xs leading-6 text-slate-400" aria-live="polite">{job.output?.length ? job.output.map((line, index) => <div key={`${index}-${line}`}>{line}</div>) : <div>Preparing onboarding command…</div>}{job.error && <div className="mt-2 text-red-400">{job.error}</div>}</div>
    </section>}
  </div>;
}
