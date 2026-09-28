import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare, Plus, Save, Trash2, XCircle } from "lucide-react";
import { createSlackIntegration, getClusterSlackChannels, getSlackIntegration, listClusters, updateClusterSlackMapping, updateSlackIntegration } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import { useApiResource } from "../hooks/useApiResource";

export default function IntegrationsPage() {
  const [slackRevision, setSlackRevision] = useState(0);
  return <div className="flex flex-col flex-1"><TopBar breadcrumbs={["Platform", "Integrations"]} /><main className="flex-1 overflow-y-auto p-6 space-y-5"><div><h1 className="text-xl font-bold text-gray-900">Backend Integrations</h1><p className="text-sm text-gray-500 mt-1">Configure organization Slack settings and cluster notification routing.</p></div><SlackIntegrationCard onChanged={() => setSlackRevision((value) => value + 1)} /><ClusterCommunicationsCard slackRevision={slackRevision} /></main></div>;
}

function ClusterCommunicationsCard({ slackRevision }) {
  const clusters = useApiResource(({ signal }) => listClusters({ signal }), []);
  const [selectedId, setSelectedId] = useState("");
  const activeId = selectedId || clusters.data?.[0]?.id || "";
  const channelResource = useApiResource(
    ({ signal }) => activeId
      ? getClusterSlackChannels(activeId, { signal })
      : Promise.resolve({ channels: [], mapping: null }),
    [activeId, slackRevision],
  );
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const channelId = drafts[activeId] ?? channelResource.data?.mapping?.id ?? "";

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      const result = await updateClusterSlackMapping(activeId, channelId || null);
      setMessage({ type: "success", text: result.mapping ? `Mapped to #${result.mapping.name}.` : "Slack channel mapping removed." });
      setDrafts((current) => ({ ...current, [activeId]: result.mapping?.id ?? "" }));
      await Promise.all([clusters.refetch(), channelResource.refetch()]);
    } catch (error) { setMessage({ type: "error", text: error.message || "Could not save channel mapping." }); }
    finally { setSaving(false); }
  };

  return <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
    <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MessageSquare size={20} /></span><div><h2 className="text-sm font-bold text-gray-900">Cluster Communications</h2><p className="text-xs text-gray-500 mt-1">Route new incidents from each cluster to its dedicated Slack channel.</p></div></div>
    {clusters.loading ? <p className="mt-5 text-sm text-gray-500">Loading clusters…</p> : clusters.error ? <div className="mt-5 text-sm text-red-600">{clusters.error.message}<button type="button" onClick={clusters.refetch} className="ml-2 font-semibold">Retry</button></div> : !clusters.data?.length ? <p className="mt-5 text-sm text-gray-500">Onboard a cluster before configuring its communications.</p> : <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
      <label className="text-xs font-semibold text-gray-700">Cluster<select value={activeId} onChange={(event) => { setSelectedId(event.target.value); setMessage(null); }} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{clusters.data.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name} ({cluster.environment})</option>)}</select></label>
      <label className="text-xs font-semibold text-gray-700">Slack channel<select value={channelId} disabled={channelResource.loading || saving} onChange={(event) => setDrafts((current) => ({ ...current, [activeId]: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"><option value="">Use organization default</option>{channelResource.data?.mapping && !(channelResource.data.channels ?? []).some((channel) => channel.id === channelResource.data.mapping.id) && <option value={channelResource.data.mapping.id}>#{channelResource.data.mapping.name} (bot no longer has access)</option>}{(channelResource.data?.channels ?? []).map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}{channel.isPrivate ? " (private)" : ""}</option>)}</select></label>
      <button type="button" onClick={save} disabled={!activeId || channelResource.loading || saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"><Save size={15} />{saving ? "Saving…" : "Save mapping"}</button>
    </div>}
    {channelResource.loading && activeId && <p className="mt-3 text-xs text-gray-500">Loading available Slack channels…</p>}
    {channelResource.error && <div className="mt-3 text-sm text-red-600">{channelResource.error.message}<button type="button" onClick={channelResource.refetch} className="ml-2 font-semibold text-blue-600 hover:underline">Retry</button></div>}
    {message && <p className={`mt-3 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
    <p className="mt-3 text-xs text-gray-500">Only channels the Slack bot has joined are available. Invite the bot in Slack, then reload this page to map another channel.</p>
    {clusters.data?.length > 0 && <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3"><h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Current cluster routing</h3></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-white text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-4 py-3 font-semibold">Cluster</th><th className="px-4 py-3 font-semibold">Environment</th><th className="px-4 py-3 font-semibold">Slack channel</th><th className="px-4 py-3 font-semibold">Routing</th></tr></thead>
        <tbody className="divide-y divide-gray-100">{clusters.data.map((cluster) => { const mapped = Boolean(cluster.slackChannelId); return <tr key={cluster.id} className="text-gray-700"><td className="px-4 py-3 font-semibold text-gray-900">{cluster.name}</td><td className="px-4 py-3">{cluster.environment || "—"}</td><td className="px-4 py-3">{mapped ? `#${cluster.slackChannelName || cluster.slackChannelId}` : "Organization default"}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${mapped ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{mapped ? "Cluster-specific" : "Default"}</span></td></tr>; })}</tbody>
      </table></div>
    </div>}
  </section>;
}

function SlackIntegrationCard({ onChanged }) {
  const resource = useApiResource(({ signal }) => getSlackIntegration({ signal }), []);
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [channel, setChannel] = useState("");
  const [routes, setRoutes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const configured = Boolean(resource.data?.botTokenConfigured && resource.data?.slackIncidentChannelId);

  useEffect(() => {
    if (!resource.data) return;
    // The API response is the authoritative persisted form snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(resource.data.slackEnabled);
    setChannel(resource.data.slackIncidentChannelId ?? "");
    setRoutes(Object.entries(resource.data.slackServiceChannels ?? {}).map(([service, channelId]) => ({ service, channelId })));
  }, [resource.data]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setMessage(null);
    const slackServiceChannels = Object.fromEntries(routes.filter((item) => item.service.trim() && item.channelId.trim()).map((item) => [item.service.trim(), item.channelId.trim()]));
    const payload = { slackEnabled: true, slackIncidentChannelId: channel.trim() || null, slackServiceChannels, ...(token.trim() ? { slackBotToken: token.trim() } : {}) };
    try {
      await (resource.data?.updatedAt ? updateSlackIntegration(payload) : createSlackIntegration(payload));
      setToken(""); setMessage({ type: "success", text: "Slack configuration saved." }); await resource.refetch(); onChanged?.();
    } catch (error) { setMessage({ type: "error", text: error.message || "Could not save Slack configuration." }); }
    finally { setSaving(false); }
  };

  const toggle = async (nextEnabled) => {
    setEnabled(nextEnabled); setMessage(null);
    if (nextEnabled || !resource.data?.updatedAt) return;
    setSaving(true);
    try { await updateSlackIntegration({ slackEnabled: false }); setMessage({ type: "success", text: "Slack integration disabled." }); await resource.refetch(); onChanged?.(); }
    catch (error) { setEnabled(true); setMessage({ type: "error", text: error.message || "Could not disable Slack integration." }); }
    finally { setSaving(false); }
  };

  const updateRoute = (index, field, value) => setRoutes((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));

  return <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50"><SlackMark /></span><div><h2 className="text-sm font-bold text-gray-900">Slack incident notifications</h2><p className="text-xs text-gray-500 mt-1">Settings apply only to your organization. Stored tokens are never returned by the API.</p></div></div><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={enabled} disabled={saving || resource.loading} onChange={(event) => toggle(event.target.checked)} className="h-4 w-4" />Enable Slack Integration</label></div>
    {!resource.loading && !resource.error && <div className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-3 ${configured ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>{configured ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-green-600" /> : <XCircle size={17} className="mt-0.5 shrink-0 text-amber-600" />}<div><p className={`text-sm font-semibold ${configured ? "text-green-800" : "text-amber-800"}`}>{configured ? "Slack is configured" : "Slack configuration is incomplete"}</p><p className="mt-0.5 text-xs text-gray-600">{configured ? `Incident notifications are configured for channel ${resource.data.slackIncidentChannelId}.` : "Add a bot token and default incident channel to complete the connection."}{configured && !enabled ? " The integration is currently disabled." : ""}</p></div></div>}
    {resource.loading ? <p className="text-sm text-gray-500 mt-5">Loading Slack configuration…</p> : resource.error ? <div className="mt-5 text-sm text-red-600">{resource.error.message}<button type="button" onClick={resource.refetch} className="ml-2 font-semibold">Retry</button></div> : <form onSubmit={save} className={`mt-5 space-y-4 ${!enabled ? "opacity-60" : ""}`}>
      <fieldset disabled={!enabled || saving} className="space-y-4"><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><label className="text-xs font-semibold text-gray-700">Bot User OAuth Token<input type="password" autoComplete="new-password" value={token} onChange={(event) => setToken(event.target.value)} placeholder={resource.data?.botTokenConfigured ? "Configured — leave blank to keep" : "xoxb-…"} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100" /></label><label className="text-xs font-semibold text-gray-700">Default Incident Channel ID<input value={channel} onChange={(event) => setChannel(event.target.value)} placeholder="C0123456789" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100" /></label></div><div><div className="flex items-center justify-between"><h3 className="text-xs font-bold text-gray-700">Service channel routing</h3><button type="button" onClick={() => setRoutes((items) => [...items, { service: "", channelId: "" }])} className="flex items-center gap-1 text-xs font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-gray-400"><Plus size={14} />Add rule</button></div><div className="mt-2 space-y-2">{routes.length ? routes.map((route, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input aria-label={`Service ${index + 1}`} value={route.service} onChange={(event) => updateRoute(index, "service", event.target.value)} placeholder="checkout-api" className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100" /><input aria-label={`Channel ${index + 1}`} value={route.channelId} onChange={(event) => updateRoute(index, "channelId", event.target.value)} placeholder="C0123456789" className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100" /><button type="button" aria-label={`Remove rule ${index + 1}`} onClick={() => setRoutes((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="p-2 text-red-500 disabled:cursor-not-allowed disabled:text-gray-400"><Trash2 size={16} /></button></div>) : <p className="text-xs text-gray-500">No service-specific routes. Incidents use the default channel.</p>}</div></div></fieldset>
      {message && <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
      <button disabled={!enabled || saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"><Save size={15} />{saving ? "Saving…" : configured ? "Update Connection" : "Connect Slack"}</button>
    </form>}
  </section>;
}

function SlackMark() {
  return <svg
    aria-label="Slack"
    role="img"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 15a2 2 0 1 1-2-2h2v2Zm1 0a2 2 0 0 1 4 0v5a2 2 0 1 1-4 0v-5Z" fill="#E01E5A" />
    <path d="M9 6a2 2 0 1 1 2-2v2H9Zm0 1a2 2 0 0 1 0 4H4a2 2 0 1 1 0-4h5Z" fill="#36C5F0" />
    <path d="M18 9a2 2 0 1 1 2 2h-2V9Zm-1 0a2 2 0 0 1-4 0V4a2 2 0 1 1 4 0v5Z" fill="#2EB67D" />
    <path d="M15 18a2 2 0 1 1-2 2v-2h2Zm0-1a2 2 0 0 1 0-4h5a2 2 0 1 1 0 4h-5Z" fill="#ECB22E" />
  </svg>;
}
