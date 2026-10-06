import { useState } from "react";
import { Activity, CheckCircle2, PhoneCall, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { getVoiceAgentStatus, listVoiceAgentDeliveries, requestVoiceAgentTestCall } from "../../api/endpoints";
import { AsyncSection, StaleBanner } from "../ui/AsyncState";
import StatusPill from "../ui/StatusPill";
import TopBar from "../layout/TopBar";
import { livePollMs, useApiResource } from "../../hooks/useApiResource";

const E164 = /^\+[1-9]\d{7,14}$/;

export default function VoiceAgentDashboard() {
  const status = useApiResource(({ signal }) => getVoiceAgentStatus({ signal }), [], { pollMs: livePollMs });
  const deliveries = useApiResource(({ signal }) => listVoiceAgentDeliveries({ signal }), [], { pollMs: livePollMs });
  const [phone, setPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
  const validPhone = E164.test(normalizedPhone);
  const canTest = status.data?.connected && validPhone;

  const testCall = async () => {
    if (!validPhone) return;
    setTesting(true);
    setMessage(null);
    try {
      const result = await requestVoiceAgentTestCall(normalizedPhone);
      setMessage({ ok: true, text: `Test call queued for ${result.maskedPhoneNumber}.` });
      setTimeout(() => void deliveries.refetch(), 1000);
    } catch (error) {
      setMessage({ ok: false, text: error.message || "Could not queue the test call." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Notifications", "Voice Agent"]} />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Voice Agent</h1>
          <p className="mt-1 text-sm text-gray-500">Administrative health, test controls, and recent Retell call delivery outcomes.</p>
        </div>

        {message && <div className={`rounded-lg border px-4 py-3 text-sm ${message.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <Activity size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Configuration Status</h2>
            <button type="button" onClick={status.refetch} aria-label="Refresh voice configuration status" title="Refresh configuration status" disabled={status.refreshing} className="ml-auto text-gray-400 hover:text-blue-600 disabled:cursor-wait">
              <RefreshCw size={15} className={status.refreshing ? "animate-spin" : ""} />
            </button>
          </div>
          <AsyncSection {...status} onRetry={status.refetch}>
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <Health label="Retell connection" healthy={status.data?.connected} detail={status.data?.message} />
              <Health label="Outbound number" healthy={!status.data?.stale && Boolean(status.data?.maskedFromNumber)} detail={status.data?.stale ? "Worker status is stale" : status.data?.maskedFromNumber || "Not configured"} />
              <Health label="Voice agent" healthy={!status.data?.stale && status.data?.voiceAgentConfigured} detail={status.data?.stale ? "Worker status is stale" : status.data?.voiceAgentConfigured ? "Configured" : "Not configured"} />
              <div className="md:col-span-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                <ShieldCheck size={14} />API keys are held by the notification service and are never returned to this dashboard.{status.data?.checkedAt && ` Last checked ${formatTime(status.data.checkedAt)}.`}
              </div>
            </div>
          </AsyncSection>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Test-call destination</h2>
            <p className="mt-1 text-xs text-gray-500">Enter any E.164 number supported by your Retell telephony provider. The number is used only for this test and is not saved as a contact.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3 p-5">
            <label className="min-w-72 flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-gray-700">Phone number</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+15551234567" autoComplete="tel" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              {phone && !validPhone && <span className="mt-1 block text-xs text-red-600">Enter an international E.164 number.</span>}
            </label>
            <button type="button" onClick={testCall} disabled={testing || !canTest} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300">
              <PhoneCall size={16} />{testing ? "Queuing…" : "Test Call"}
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4"><PhoneCall size={16} className="text-gray-400" /><h2 className="text-sm font-bold text-gray-900">Recent Deliveries</h2><span className="ml-auto text-xs text-gray-400">{deliveries.data?.length ?? 0}</span></div>
          <div className="px-4 pt-3"><StaleBanner error={deliveries.data ? deliveries.error : null} onRetry={deliveries.refetch} /></div>
          <AsyncSection {...deliveries} onRetry={deliveries.refetch} isEmpty={(items) => items.length === 0} emptyTitle="No voice deliveries yet" emptyHint="Critical incident calls and test calls will appear here.">
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">Incident ID</th><th className="px-5 py-3">Recipient</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Call Status</th><th className="px-5 py-3">Timestamp</th></tr></thead><tbody className="divide-y divide-gray-100">{(deliveries.data ?? []).map((item) => <tr key={item.id}><td className="px-5 py-3 font-mono text-xs text-gray-700">{item.isTest ? "Test call" : item.incidentId}</td><td className="px-5 py-3 font-semibold text-gray-900">{item.sreName}</td><td className="px-5 py-3 font-mono text-gray-600">{item.maskedPhoneNumber}</td><td className="px-5 py-3"><StatusPill status={item.status} /></td><td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatTime(item.timestamp)}</td></tr>)}</tbody></table></div>
          </AsyncSection>
        </section>
      </main>
    </div>
  );
}

function Health({ label, healthy, detail }) {
  const Icon = healthy ? CheckCircle2 : XCircle;
  return <div className={`rounded-lg border p-4 ${healthy ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}><div className="flex items-center gap-2"><Icon size={17} className={healthy ? "text-green-600" : "text-amber-600"} /><p className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</p></div><p className="mt-2 text-sm font-semibold text-gray-900">{detail}</p></div>;
}

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}
