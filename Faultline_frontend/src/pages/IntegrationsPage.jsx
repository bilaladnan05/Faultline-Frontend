import { Plus, Shield, CreditCard, Database, Bell, GitBranch, Wifi } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";
import { integrations } from "../mocks/integrations";
import { showToast } from "../utils/toast";

const ICONS = {
  shield: Shield,
  "credit-card": CreditCard,
  database: Database,
  bell: Bell,
  github: GitBranch,
};

const ENV_COLORS = {
  Production: "bg-blue-50 text-blue-700 border border-blue-100",
  Staging: "bg-purple-50 text-purple-700 border border-purple-100",
};

const BORDER_COLORS = {
  connected: "border-l-green-400",
  disconnected: "border-l-red-400",
  degraded: "border-l-yellow-400",
};

export default function IntegrationsPage() {
  const repos = integrations.filter((i) => i.type === "github");
  const services = integrations.filter((i) => i.type === "service");

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Integrations"]}
        action={
          <button
            onClick={() => showToast("Integration wizard opened.")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add New Application
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Integrations &amp; Connected Services</h1>
          <p className="text-sm text-gray-500 mt-1">Manage GitHub repository connections (FR-01) and WebSocket-connected services (FR-05).</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: "Connected", count: integrations.filter((i) => i.status === "connected").length, color: "bg-green-50 text-green-700" },
            { label: "Degraded", count: integrations.filter((i) => i.status === "degraded").length, color: "bg-yellow-50 text-yellow-700" },
            { label: "Disconnected", count: integrations.filter((i) => i.status === "disconnected").length, color: "bg-red-50 text-red-700" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white`}>
              <span className={`w-2 h-2 rounded-full ${s.color.includes("green") ? "bg-green-500" : s.color.includes("yellow") ? "bg-yellow-500" : "bg-red-500"}`} />
              <span className="font-bold">{s.count}</span> {s.label}
            </div>
          ))}
        </div>

        {/* GitHub Repos — FR-01 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={16} className="text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900">GitHub Repositories</h2>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">FR-01</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {repos.map((r) => (
              <div key={r.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${BORDER_COLORS[r.status]} shadow-sm p-4`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GitBranch size={18} className="text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{r.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ENV_COLORS[r.env]}`}>{r.env}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2 truncate">{r.repo}</p>
                    <div className="flex items-center gap-3">
                      <StatusPill status={r.status} />
                      {r.openIssues > 0 && (
                        <span className="text-xs font-semibold text-orange-600">{r.openIssues} open issues</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Last sync: {r.lastSync}</span>
                  <button className="text-xs font-bold text-blue-600 hover:underline">Run Analysis →</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Services — FR-05 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Wifi size={16} className="text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900">Connected Services</h2>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">FR-05</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {services.map((s) => {
              const Icon = ICONS[s.icon] || Shield;
              return (
                <div key={s.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${BORDER_COLORS[s.status]} shadow-sm p-4`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900">{s.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ENV_COLORS[s.env]}`}>{s.env}</span>
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Region</p>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">{s.region}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">WS Endpoints</p>
                      <p className={`text-xs font-semibold mt-0.5 ${s.wsEndpoints === 0 ? "text-red-600" : "text-gray-800"}`}>
                        {s.wsEndpoints} Active
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => showToast(`${s.name} logs opened.`)} className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg hover:bg-gray-50">
                      View Logs
                    </button>
                    <button onClick={() => showToast(`${s.name} settings opened.`)} className="flex-1 bg-blue-50 text-blue-600 text-xs font-semibold py-1.5 rounded-lg hover:bg-blue-100 border border-blue-100">
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
