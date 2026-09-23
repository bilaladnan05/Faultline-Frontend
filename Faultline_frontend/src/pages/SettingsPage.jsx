import { useState } from "react";
import { Bell, Lock, Palette, Globe } from "lucide-react";
import TopBar from "../components/layout/TopBar";

const SETTINGS_SECTIONS = [
  {
    title: "Notifications",
    icon: Bell,
    rows: [
      { label: "Critical alert emails", desc: "Send an email when a CRITICAL severity alert fires", key: "critical" },
      { label: "Weekly digest", desc: "Summary of incidents, MTTR, and health score every Monday", key: "digest" },
      { label: "AI remediation updates", desc: "Notify when Faultline AI takes an automated action", key: "ai" },
    ],
  },
  {
    title: "Security",
    icon: Lock,
    rows: [
      { label: "Require MFA for all members", desc: "Enforce multi-factor authentication org-wide", key: "mfa" },
      { label: "Session timeout after 30 min", desc: "Automatically sign out inactive sessions", key: "timeout" },
    ],
  },
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState({ critical: true, digest: true, ai: false, mfa: true, timeout: false });

  const toggle = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Settings"]} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage notifications, security, and workspace preferences.</p>
        </div>

        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <section.icon size={15} className="text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">{section.title}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {section.rows.map((row) => (
                <div key={row.key} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{row.desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(row.key)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${toggles[row.key] ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${toggles[row.key] ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Palette size={15} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Appearance & Region</h2>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold text-gray-900">Timezone</p>
              <p className="text-xs text-gray-400 mt-0.5">Used for timestamps across incidents and reports</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5">
              <Globe size={13} className="text-gray-400" />
              UTC-05:00 (Eastern)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
