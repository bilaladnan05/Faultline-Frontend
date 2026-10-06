import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight, Bell, Monitor, BookOpen, MessageSquareText,
  BarChart2, Lock, LogOut, Phone, Users, Server, Zap, Plug, Network, ShieldCheck,
  ScrollText, CreditCard,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { FEATURES, lockFor } from "../../auth/plans";
import { roleLabel } from "../../auth/roles";
import { useProject } from "../../context/useProject";

/**
 * Every page, with the plan module that carries it. There is no separate incidents list:
 * the Incident Ledger is the list, and each row opens the incident's details page.
 */
const NAV = {
  clusters: { to: "/clusters", icon: Server, label: "Onboarded Clusters", end: true, feature: FEATURES.CLUSTERS },
  onboarding: { to: "/clusters/onboarding", icon: Network, label: "Cluster Onboarding", feature: FEATURES.CLUSTER_ONBOARDING },
  alerts: { to: "/alerts", icon: Bell, label: "Alerts", feature: FEATURES.ALERTS },
  integrations: { to: "/integrations", icon: Plug, label: "Integrations", feature: FEATURES.INTEGRATIONS },
  runtime: { to: "/runtime", icon: Monitor, label: "Runtime", feature: FEATURES.LOG_AGGREGATOR },
  ledger: { to: "/ledger", icon: BookOpen, label: "Incident Ledger", feature: FEATURES.INCIDENT_LEDGER },
  reporting: { to: "/reporting", icon: BarChart2, label: "Reports", feature: FEATURES.REPORTING },
  voiceAgent: { to: "/voice-agent", icon: Phone, label: "Voice Agent", feature: FEATURES.VOICE_AGENT },
  smsAgent: { to: "/sms-agent", icon: MessageSquareText, label: "SMS Agent", feature: FEATURES.VOICE_AGENT },
  team: { to: "/team", icon: Users, label: "Team & Roles", feature: FEATURES.TEAM_MANAGEMENT },
  audit: { to: "/admin/audit", icon: ScrollText, label: "Audit Log" },
  subscription: { to: "/admin/subscription", icon: CreditCard, label: "Subscription" },
  security: { to: "/security/mfa", icon: ShieldCheck, label: "Account Security" },
};

/**
 * Each role has two menus: `start`, before a cluster is opened, and `cluster`, after
 * Manage (or View Logs) opens one.
 */
const MENUS = {
  /** Org owner (admin): organization pages, then everything but the cluster registry. */
  owner: {
    start: [NAV.clusters, NAV.onboarding, NAV.team, NAV.audit, NAV.subscription, NAV.integrations, NAV.security],
    cluster: [
      NAV.alerts, NAV.integrations, NAV.runtime,
      NAV.ledger, NAV.reporting, NAV.voiceAgent, NAV.smsAgent, NAV.team, NAV.audit, NAV.subscription, NAV.security,
    ],
  },
  /** Onsite engineer: pick a cluster, then only its operational pages. */
  engineer: {
    start: [NAV.clusters, NAV.security],
    cluster: [NAV.alerts, NAV.runtime, NAV.ledger, NAV.reporting, NAV.security],
  },
};

/** Pages that belong to no single cluster; arriving on one leaves the cluster. */
const ORGANIZATION_PATHS = new Set([
  NAV.clusters.to,
  NAV.onboarding.to,
  NAV.audit.to,
  NAV.subscription.to,
]);

const initialsOf = (name = "", email = "") => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((email || "").slice(0, 2) || "??").toUpperCase();
};

/**
 * The menu is a courtesy, not the control: route guards and the API refuse what a role
 * may not reach, whatever this shows.
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAdmin, signOut, entitlements } = useAuth();
  const { activeProject, clearActiveProject } = useProject();
  const inCluster = Boolean(activeProject);

  // The registry pages are everyone's starting point however they are reached - the
  // switch button, the back button, sign-in or a typed URL - so arriving there closes
  // whichever cluster was open instead of leaving its menu showing.
  useEffect(() => {
    if (ORGANIZATION_PATHS.has(pathname)) clearActiveProject();
  }, [pathname, clearActiveProject]);

  const menu = isAdmin ? MENUS.owner : MENUS.engineer;
  const navItems = inCluster ? menu.cluster : menu.start;

  // The open cluster is cleared too, so the next person to sign in on this tab starts
  // on their own start menu rather than inside someone else's cluster.
  const handleSignOut = async () => {
    clearActiveProject();
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="font-bold text-gray-900 text-[15px] tracking-tight">Faultline</span>
      </div>

      {/* The open cluster, and the way back to all of them. */}
      {inCluster && (
        <button
          type="button"
          onClick={() => {
            clearActiveProject();
            navigate("/clusters");
          }}
          title="Back to all clusters"
          className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Server size={13} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Managing cluster</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{activeProject.name}</p>
          </div>
          <ArrowLeftRight size={13} className="text-gray-300 flex-shrink-0" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">
          {inCluster ? "Cluster" : isAdmin ? "Organization" : "Your clusters"}
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end, feature }) => {
            // A module outside the plan stays visible, marked with the tier that carries
            // it, and opens an explanation rather than the page.
            const lock = lockFor(entitlements, feature);
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  title={lock ? `${label} is on the ${lock.requiredPlanName} plan` : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : lock
                          ? "text-gray-400 hover:bg-gray-50"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? "text-blue-600" : lock ? "text-gray-300" : "text-gray-400"} />
                      <span className="flex-1">{label}</span>
                      {lock && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          <Lock size={9} /> {lock.requiredPlanName}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

      </nav>

      {/* Signed-in user */}
      <div className="px-3 py-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 text-xs font-bold">{initialsOf(user?.name, user?.email)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight truncate" title={user?.email}>
              {user?.name ?? "Signed in"}
            </p>
            <p className="text-xs text-gray-500 truncate">{roleLabel(user?.role)}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
