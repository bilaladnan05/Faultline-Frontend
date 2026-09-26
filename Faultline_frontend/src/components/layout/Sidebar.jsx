import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, AlertTriangle, Bell, Monitor, BookOpen,
  BarChart2, Phone, Users, Server, Zap, Plug
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/incidents", icon: AlertTriangle, label: "Incidents" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/deployments", icon: Server, label: "Clusters" },
  { to: "/integrations", icon: Plug, label: "Integrations" },
  { to: "/runtime", icon: Monitor, label: "Runtime" },
  { to: "/ledger", icon: BookOpen, label: "Incident Ledger" },
  { to: "/reporting", icon: BarChart2, label: "Reports" },
  { to: "/voice-agent", icon: Phone, label: "Voice Agent" },
  { to: "/team", icon: Users, label: "Team & Roles" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="font-bold text-gray-900 text-[15px] tracking-tight">Faultline</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Main Menu</p>
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

      <div className="px-3 py-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <div>
            <p className="text-xs font-semibold text-gray-700">Operator console</p>
            <p className="text-[10px] text-gray-400">Connected through the API</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
