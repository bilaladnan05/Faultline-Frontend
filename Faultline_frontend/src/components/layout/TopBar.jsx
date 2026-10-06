import { useEffect, useState } from "react";
import { Bell, HelpCircle, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BREADCRUMB_ROUTES = {
  Administration: "/team",
  Alerts: "/alerts",
  Clusters: "/clusters",
  Deployments: "/clusters",
  Home: "/clusters",
  "Incident Ledger": "/ledger",
  Incidents: "/ledger",
  Integrations: "/integrations",
  Notifications: "/voice-agent",
  Platform: "/integrations",
  Reports: "/reporting",
  Runtime: "/runtime",
  Settings: "/settings",
};

export default function TopBar({ breadcrumbs = [], action }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!showHelp) return undefined;
    const close = (event) => {
      if (event.key === "Escape") setShowHelp(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [showHelp]);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/ledger?search=${encodeURIComponent(term)}` : "/ledger");
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-4 px-6 flex-shrink-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
          {breadcrumbs.map((crumb, index) => {
            const route = index < breadcrumbs.length - 1 ? BREADCRUMB_ROUTES[crumb] : undefined;
            return (
              <span key={`${crumb}-${index}`} className="flex items-center gap-1.5 min-w-0">
                {index > 0 && <span className="text-gray-300">/</span>}
                {route ? (
                  <button type="button" onClick={() => navigate(route)} className="truncate text-gray-400 font-medium hover:text-blue-600">
                    {crumb}
                  </button>
                ) : (
                  <span className={`truncate ${index === breadcrumbs.length - 1 ? "text-gray-900 font-semibold" : "text-gray-400 font-medium"}`}>
                    {crumb}
                  </span>
                )}
              </span>
            );
          })}
        </nav>

        <form onSubmit={submitSearch} role="search" className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search incidents, assets or logs"
            placeholder="Search incidents, assets or logs..."
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72 placeholder:text-gray-400"
          />
        </form>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate("/alerts")} aria-label="Open alerts" title="Open alerts" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 relative">
            <Bell size={15} aria-hidden="true" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setShowHelp(true)} aria-label="Open help" title="Help" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <HelpCircle size={15} aria-hidden="true" />
          </button>
        </div>

        {action && <div className="flex-shrink-0">{action}</div>}
      </header>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHelp(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="topbar-help-title" className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 id="topbar-help-title" className="text-sm font-bold text-gray-900">Faultline navigation help</h2>
                <p className="mt-1 text-xs leading-5 text-gray-600">Use the search box to filter the incident ledger. The bell opens alerts, breadcrumbs return to parent pages, and each page’s Refresh button reloads its latest data.</p>
              </div>
              <button type="button" onClick={() => setShowHelp(false)} aria-label="Close help" className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="flex justify-end rounded-b-xl bg-gray-50 px-5 py-3">
              <button type="button" onClick={() => setShowHelp(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Close</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
