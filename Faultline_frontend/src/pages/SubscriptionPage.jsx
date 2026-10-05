import { Check, Zap, Building2, Star, CreditCard } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { showToast } from "../utils/toast";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "$0",
    period: "/ mo",
    icon: Zap,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    current: false,
    features: [
      "Up to 3 AI Agent Bots",
      "10,000 LLM Tokens / month",
      "1 GitHub Repository",
      "Daily scan frequency",
      "Email notifications",
      "Community support",
    ],
    limits: { bots: 3, botMax: 10, tokens: 10000, tokenMax: 100000, scanFreq: "Daily" },
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/ mo",
    icon: Star,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    current: true,
    badge: "Current Plan",
    features: [
      "Up to 10 AI Agent Bots",
      "100,000 LLM Tokens / month",
      "10 GitHub Repositories",
      "Hourly scan frequency",
      "Slack + Email notifications",
      "Voice Agent (Twilio)",
      "Priority support",
    ],
    limits: { bots: 7, botMax: 10, tokens: 72000, tokenMax: 100000, scanFreq: "Hourly" },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Building2,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    current: false,
    features: [
      "Unlimited AI Agent Bots",
      "Unlimited LLM Tokens",
      "Unlimited Repositories",
      "Real-time scan frequency",
      "Full notification suite",
      "Custom AI model fine-tuning",
      "Dedicated SLA + support",
      "Audit logs &amp; compliance",
    ],
    limits: { bots: null, botMax: null, tokens: null, tokenMax: null, scanFreq: "Real-time" },
  },
];

export default function SubscriptionPage() {
  const current = plans.find((p) => p.current);

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Subscription"]} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Subscription &amp; Billing</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your plan, usage limits, and payment details. <span className="font-semibold text-blue-600">FR-15</span></p>
          </div>
          <button className="text-xs font-bold text-purple-600 hover:underline">Admin: Manage Pricing →</button>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border-2 shadow-sm flex flex-col p-6 relative transition-shadow ${plan.current ? "border-blue-500 shadow-blue-100 shadow-md" : "border-gray-200 hover:border-gray-300"}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.iconBg}`}>
                  <Icon size={18} className={plan.iconColor} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <div className="flex items-end gap-1 mt-1 mb-5">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-400 pb-0.5">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check size={13} className={`flex-shrink-0 mt-0.5 ${plan.current ? "text-blue-600" : "text-green-500"}`} />
                      <span dangerouslySetInnerHTML={{ __html: f }} />
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => showToast(plan.current ? "You are already on this plan." : `Upgrade to ${plan.name} initiated.`)}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${plan.current ? "bg-blue-600 text-white cursor-default" : plan.id === "enterprise" ? "border-2 border-purple-600 text-purple-600 hover:bg-purple-50" : "border-2 border-gray-200 text-gray-700 hover:border-gray-300"}`}
                >
                  {plan.current ? "✓ Current Plan" : plan.id === "enterprise" ? "Contact Sales" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Usage Meters — FR-15 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900">Current Usage — {current.name} Plan</h2>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">FR-15</span>
          </div>
          <div className="space-y-5">
            {[
              { label: "Agent Bot Limit", used: current.limits.bots, max: current.limits.botMax, unit: "bots", color: "bg-blue-500" },
              { label: "LLM Token Consumption", used: current.limits.tokens, max: current.limits.tokenMax, unit: "tokens", color: "bg-purple-500" },
            ].map((meter) => {
              const pct = meter.max ? Math.round((meter.used / meter.max) * 100) : 0;
              const danger = pct > 80;
              return (
                <div key={meter.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{meter.label}</span>
                    <span className={`text-sm font-bold ${danger ? "text-red-600" : "text-gray-700"}`}>
                      {meter.used?.toLocaleString()} / {meter.max?.toLocaleString()} {meter.unit}
                      <span className="ml-2 text-gray-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${danger ? "bg-red-500" : meter.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {danger && <p className="text-xs text-red-500 font-semibold mt-1">⚠ Approaching limit — consider upgrading</p>}
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Scan Frequency</span>
              <span className="text-sm font-bold text-gray-900">{current.limits.scanFreq}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-gray-900">Payment Method</h2>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
              <div>
                <p className="text-sm font-bold text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-xs text-gray-400">Expires 08 / 26</p>
              </div>
            </div>
            <button
              onClick={() => showToast("Payment method update flow opened.")}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Update
            </button>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-500">Next billing date</span>
            <span className="font-semibold text-gray-900">July 17, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
