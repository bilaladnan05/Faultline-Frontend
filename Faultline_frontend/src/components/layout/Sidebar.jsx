import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, AlertTriangle, Bell, Monitor, BookOpen,
  BarChart2, Phone, Users, CreditCard, Settings, Zap, Plug, Rocket, ArrowLeftRight,
  ScrollText, LogOut, ShieldCheck, Wrench
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS, ROLES, roleLabel } from "../../auth/roles";

/**
 * Navigation, filtered by what the signed-in user may actually do.
 *
 * Each item names the permission it needs and is dropped when the user lacks it, so
 * adding a screen means declaring its permission once rather than remembering to hide
 * it in three places. This is presentation only — the API refuses these routes on its
 * own, and a user who types the URL gets the forbidden page, not the data.
 */

// Org-level nav — shown before a project has been selected.
const accountNavItems = [
  { to: "/projects", icon: Rocket, label: "My Projects" },
  { to: "/admin/users", icon: Users, label: "Users", permission: PERMISSIONS.USER_VIEW },
  { to: "/admin/audit", icon: ScrollText, label: "Audit Logs", permission: PERMISSIONS.AUDIT_VIEW },
  { to: "/team", icon: ShieldCheck, label: "Team & Roles", permission: PERMISSIONS.USER_VIEW },
  { to: "/subscription", icon: CreditCard, label: "Subscription", permission: PERMISSIONS.SETTINGS_MANAGE },
  { to: "/settings", icon: Settings, label: "Settings", permission: PERMISSIONS.SETTINGS_MANAGE },
];

// Project workspace nav — shown once a project has been opened.
const projectNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/incidents", icon: AlertTriangle, label: "My Incidents" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/runtime", icon: Monitor, label: "Runtime" },
  { to: "/ledger", icon: BookOpen, label: "Remediation" },
  { to: "/integrations", icon: Plug, label: "Integrations", permission: PERMISSIONS.SETTINGS_MANAGE },
  { to: "/reporting", icon: BarChart2, label: "Reports" },
  { to: "/voice-agent", icon: Phone, label: "Voice Agent" },
  { to: "/admin/users", icon: Users, label: "Users", permission: PERMISSIONS.USER_VIEW },
  { to: "/admin/audit", icon: ScrollText, label: "Audit Logs", permission: PERMISSIONS.AUDIT_VIEW },
  { to: "/subscription", icon: CreditCard, label: "Subscription", permission: PERMISSIONS.SETTINGS_MANAGE },
];

const initialsOf = (name = "", email = "") => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((email || "").slice(0, 2) || "??").toUpperCase();
};

export default function Sidebar() {
  const navigate = useNavigate();
  const { activeProject, clearActiveProject } = useProject();
  const { user, can, signOut } = useAuth();

  const navItems = (activeProject ? projectNavItems : accountNavItems).filter(
    (item) => !item.permission || can(item.permission),
  );

  const handleSwitchProject = () => {
    clearActiveProject();
    navigate("/projects");
  };

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

      {/* Active project indicator */}
      {activeProject && (
        <button
          onClick={handleSwitchProject}
          className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Rocket size={13} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{activeProject.name}</p>
          </div>
          <ArrowLeftRight size={13} className="text-gray-300 flex-shrink-0" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">
          {activeProject ? "Main Menu" : "Workspace"}
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? "text-blue-600" : "text-gray-400"} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* An engineer's reach is their assignments; saying so beats an unexplained
            short menu. */}
        {user?.role === ROLES.ONSITE_ENGINEER && !activeProject && (
          <p className="flex items-start gap-1.5 text-[11px] text-gray-400 mt-4 px-2 leading-relaxed">
            <Wrench size={11} className="mt-0.5 flex-shrink-0" />
            You see the projects an administrator has assigned to you.
          </p>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 text-xs font-bold">
              {initialsOf(user?.name, user?.email)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
              {user?.name ?? "Signed in"}
            </p>
            <p className="text-xs text-gray-500 truncate">{roleLabel(user?.role)}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
