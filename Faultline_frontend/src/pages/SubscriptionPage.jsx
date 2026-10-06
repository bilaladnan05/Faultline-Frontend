import { useState } from "react";
import { Check, Zap, Building2, Star, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { createBillingPortal } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
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
    features: [
      "Up to 3 AI Agent Bots",
      "10,000 LLM Tokens / month",
      "1 GitHub Repository",
      "Daily scan frequency",
      "Email notifications",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/ mo",
    icon: Star,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    features: [
      "Up to 10 AI Agent Bots",
      "100,000 LLM Tokens / month",
      "10 GitHub Repositories",
      "Hourly scan frequency",
      "Slack + Email notifications",
      "Voice Agent (Twilio)",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Building2,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
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
  },
];

const SUBSCRIPTION_STATUSES = {
  active: {
    label: "Active",
    detail: "Your subscription is active and its plan benefits are available.",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  past_due: {
    label: "Past due",
    detail: "A subscription payment is overdue. Update billing details to avoid losing paid access.",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  canceled: {
    label: "Cancelled",
    detail: "This subscription has been cancelled. Your account uses the Basic plan benefits.",
    className: "border-gray-200 bg-gray-100 text-gray-700",
  },
  incomplete: {
    label: "Incomplete",
    detail: "Subscription setup has not completed. Finish payment setup to activate the plan.",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

function describeSubscription(entitlements) {
  if (!entitlements) return null;
  if (!entitlements.enforced) {
    return {
      label: "Billing disabled",
      detail: "Subscription enforcement is disabled for this deployment.",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }
  if (!entitlements.subscriptionStatus) {
    return {
      label: "No subscription",
      detail: "No subscription record is attached to this account. Basic plan benefits remain available.",
      className: "border-gray-200 bg-gray-100 text-gray-700",
    };
  }
  return SUBSCRIPTION_STATUSES[entitlements.subscriptionStatus] ?? {
    label: "Unknown",
    detail: "The billing provider returned an unrecognized subscription status.",
    className: "border-gray-200 bg-gray-100 text-gray-700",
  };
}

export default function SubscriptionPage() {
  // AuthContext loads this from GET /billing/entitlements. A public visitor has no
  // organization subscription, so no tier is presented as their current plan.
  const { entitlements, isAuthenticated, isAdmin, loading } = useAuth();
  const [portalOpening, setPortalOpening] = useState(false);
  const current = plans.find((plan) => plan.id === entitlements?.plan) ?? null;
  const subscription = describeSubscription(entitlements);

  const handleManageBilling = async () => {
    setPortalOpening(true);
    try {
      const { portalUrl } = await createBillingPortal();
      window.location.assign(portalUrl);
    } catch (error) {
      showToast(error?.message || "The billing portal could not be opened.");
      setPortalOpening(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Subscription"]} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subscription &amp; Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your plan, usage limits, and payment details. <span className="font-semibold text-blue-600">FR-15</span></p>
        </div>

        {!loading && !isAuthenticated && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <Link className="font-bold text-blue-700 hover:underline" to="/login">
              Sign in
            </Link>{" "}
            to see your current subscription.
          </div>
        )}

        {!loading && isAuthenticated && !current && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Your subscription could not be loaded. Refresh the page to try again.
          </div>
        )}

        {subscription && (
          <section
            aria-label="Subscription status"
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <div>
              <h2 className="text-sm font-bold text-gray-900">Subscription status</h2>
              <p className="mt-1 text-xs text-gray-500">{subscription.detail}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${subscription.className}`}>
              {subscription.label}
            </span>
          </section>
        )}

        {/* Tier Cards */}
        <div className="grid grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.id === current?.id;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border-2 shadow-sm flex flex-col p-6 relative transition-shadow ${isCurrent ? "border-blue-500 shadow-blue-100 shadow-md" : "border-gray-200 hover:border-gray-300"}`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    Current Plan
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
                      <Check size={13} className={`flex-shrink-0 mt-0.5 ${isCurrent ? "text-blue-600" : "text-green-500"}`} />
                      <span dangerouslySetInnerHTML={{ __html: f }} />
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => showToast(isCurrent ? "You are already on this plan." : `Upgrade to ${plan.name} initiated.`)}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${isCurrent ? "bg-blue-600 text-white cursor-default" : plan.id === "enterprise" ? "border-2 border-purple-600 text-purple-600 hover:bg-purple-50" : "border-2 border-gray-200 text-gray-700 hover:border-gray-300"}`}
                >
                  {isCurrent ? "✓ Current Plan" : plan.id === "enterprise" ? "Contact Sales" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment */}
        {current && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-gray-900">Billing management</h2>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Manage securely in Stripe</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Update payment methods, view invoices, and manage renewal or cancellation settings.
              </p>
            </div>
            {isAdmin && entitlements?.subscriptionStatus ? (
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={portalOpening}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {portalOpening ? "Opening Stripe…" : "Manage billing"}
              </button>
            ) : (
              <span className="shrink-0 text-xs font-semibold text-gray-500">
                {isAdmin ? "No billing customer available" : "Organization admins only"}
              </span>
            )}
          </div>
        </div>}
      </div>
    </div>
  );
}
