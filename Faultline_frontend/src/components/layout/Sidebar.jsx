import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, AlertTriangle, Bell, Monitor, BookOpen,
  BarChart2, Phone, Users, CreditCard, Settings, Zap, Plug, Rocket, ArrowLeftRight
} from "lucide-react";
import { useProject } from "../../context/useProject";

// Org-level nav — shown before a project/deployment has been selected.
const accountNavItems = [
  { to: "/deployments", icon: Rocket, label: "Deployments" },
  { to: "/team", icon: Users, label: "Team & Roles" },
  { to: "/subscription", icon: CreditCard, label: "Subscription" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

// Project workspace nav — shown once a project has been selected via "Manage".
const projectNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/incidents", icon: AlertTriangle, label: "Incidents" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/integrations", icon: Plug, label: "Integrations" },
  { to: "/runtime", icon: Monitor, label: "Runtime" },
  { to: "/ledger", icon: BookOpen, label: "Incident Ledger" },
  { to: "/reporting", icon: BarChart2, label: "Reports" },
  { to: "/voice-agent", icon: Phone, label: "Voice Agent" },
  { to: "/team", icon: Users, label: "Team & Roles" },
  { to: "/subscription", icon: CreditCard, label: "Subscription" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { activeProject, clearActiveProject } = useProject();
  const navItems = activeProject ? projectNavItems : accountNavItems;

  const handleSwitchProject = () => {
    clearActiveProject();
    navigate("/deployments");
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
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate("/team")}>
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 text-xs font-bold">AR</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">Alex Rivera</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <Settings size={14} className="text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
