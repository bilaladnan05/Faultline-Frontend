import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Zap, Building2, Star, CreditCard } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  createBillingPortal,
  createPlanUpgrade,
  getCheckoutStatus,
  syncBillingSubscription,
} from "../api/endpoints";
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
      "Cluster Onboarding for 1 cluster",
      "Onboarded Clusters overview",
      "Incidents with evidence and technical reports",
      "Alerts for unresolved incidents",
      "Incident Ledger",
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
      "Everything in Basic",
      "Unlimited clusters",
      "Runtime log monitoring",
      "Reports and incident analytics",
      "Voice Agent calls and SMS",
      "Integrations, including Slack",
      "Team & Roles",
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
      "Everything in Pro",
      "Remediation Runner",
      "Static Code Analyzer",
      "Incident Playbook Generator",
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

function formatBillingDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date);
}

function describeBillingDate(entitlements) {
  const date = formatBillingDate(entitlements?.subscriptionPeriodEnd);
  if (!date) return null;
  if (entitlements.cancelAtPeriodEnd) {
    return {
      label: "Cancellation date",
      detail: `Pro access ends on ${date}. Your organization will switch to Basic automatically.`,
    };
  }
  if (entitlements.subscriptionStatus === "canceled") {
    return {
      label: "Plan ended",
      detail: `Pro access ended on ${date}. Your organization is now on Basic.`,
    };
  }
  if (entitlements.plan === "pro" && entitlements.subscriptionStatus === "active") {
    return {
      label: "Renewal date",
      detail: `Your Pro plan renews on ${date}.`,
    };
  }
  return null;
}

export default function SubscriptionPage() {
  // AuthContext loads this from GET /billing/entitlements. A public visitor has no
  // organization subscription, so no tier is presented as their current plan.
  const { entitlements, isAuthenticated, isAdmin, loading, refreshEntitlements } = useAuth();
  const [searchParams] = useSearchParams();
  const [portalOpening, setPortalOpening] = useState(false);
  const [upgradeOpening, setUpgradeOpening] = useState(false);
  const [upgradeReturn, setUpgradeReturn] = useState(null);
  const [billingSyncError, setBillingSyncError] = useState("");
  const billingSyncStarted = useRef(false);
  const current = plans.find((plan) => plan.id === entitlements?.plan) ?? null;
  const subscription = describeSubscription(entitlements);
  const billingDate = describeBillingDate(entitlements);
  const checkoutOutcome = searchParams.get("checkout");
  const checkoutSessionId = searchParams.get("session_id");
  const displayedUpgradeReturn =
    upgradeReturn ??
    (checkoutOutcome === "cancel"
      ? { type: "cancel", message: "Upgrade cancelled. No plan change was made." }
      : checkoutOutcome === "success" && checkoutSessionId
        ? { type: "pending", message: "Confirming your Pro upgrade…" }
        : null);

  useEffect(() => {
    if (checkoutOutcome !== "success" || !checkoutSessionId) return undefined;

    let cancelled = false;
    let timer;
    const confirmUpgrade = async (attempt = 0) => {
      try {
        const status = await getCheckoutStatus(checkoutSessionId);
        const fresh = status.paid ? await refreshEntitlements() : null;
        if (cancelled) return;
        if (fresh?.plan === "pro") {
          setUpgradeReturn({
            type: "success",
            message: "Upgrade complete. Pro features are now available.",
          });
          return;
        }
        if (attempt < 7) {
          timer = window.setTimeout(() => confirmUpgrade(attempt + 1), 1500);
          return;
        }
        setUpgradeReturn({
          type: "pending",
          message: status.paid
            ? "Payment was received. Pro activation is still processing; refresh shortly."
            : "Stripe is still confirming the payment. Your plan will update automatically once it settles.",
        });
      } catch (error) {
        if (!cancelled)
          setUpgradeReturn({
            type: "error",
            message: error?.message || "The upgrade status could not be confirmed.",
          });
      }
    };
    confirmUpgrade();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [checkoutOutcome, checkoutSessionId, refreshEntitlements]);

  useEffect(() => {
    if (
      billingSyncStarted.current ||
      loading ||
      !isAdmin ||
      current?.id !== "pro" ||
      !entitlements?.enforced
    ) return;
    billingSyncStarted.current = true;
    syncBillingSubscription()
      .then(() => refreshEntitlements())
      .catch((error) =>
        setBillingSyncError(
          error?.message || "The latest Stripe subscription status could not be loaded.",
        ),
      );
  }, [current?.id, entitlements?.enforced, isAdmin, loading, refreshEntitlements]);

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

  const handleUpgradeToPro = async () => {
    setUpgradeOpening(true);
    try {
      const { checkoutUrl } = await createPlanUpgrade("pro");
      window.location.assign(checkoutUrl);
    } catch (error) {
      showToast(error?.message || "The Pro upgrade could not be started.");
      setUpgradeOpening(false);
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
              {billingDate && (
                <p
                  aria-label={billingDate.label}
                  className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800"
                >
                  <CalendarDays size={14} aria-hidden="true" />
                  {billingDate.detail}
                </p>
              )}
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${subscription.className}`}>
              {subscription.label}
            </span>
          </section>
        )}

        {displayedUpgradeReturn && (
          <div
            role={displayedUpgradeReturn.type === "error" ? "alert" : "status"}
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              displayedUpgradeReturn.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : displayedUpgradeReturn.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : displayedUpgradeReturn.type === "cancel"
                    ? "border-gray-200 bg-gray-50 text-gray-700"
                    : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {displayedUpgradeReturn.message}
          </div>
        )}

        {billingSyncError && (
          <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {billingSyncError}
          </p>
        )}

        {/* Tier Cards */}
        <div className="grid grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.id === current?.id;
            const canUpgradeToPro =
              plan.id === "pro" && current?.id === "basic" && isAdmin && entitlements?.enforced;
            const isIncluded = plan.id === "basic" && current?.id === "pro";
            const buttonLabel = isCurrent
              ? "✓ Current Plan"
              : plan.id === "enterprise"
                ? "Coming Soon"
                : isIncluded
                  ? "Included in Pro"
                  : plan.id === "pro"
                    ? upgradeOpening
                      ? "Opening Stripe…"
                      : "Upgrade to Pro"
                    : "Basic Plan";
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
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={canUpgradeToPro ? handleUpgradeToPro : undefined}
                  disabled={!canUpgradeToPro || upgradeOpening}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${isCurrent ? "bg-blue-600 text-white cursor-default" : plan.id === "enterprise" ? "border-2 border-purple-600 text-purple-600 hover:bg-purple-50" : "border-2 border-gray-200 text-gray-700 hover:border-gray-300"}`}
                >
                  {buttonLabel}
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
            {isAdmin && current?.id === "pro" && entitlements?.subscriptionStatus ? (
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
                {isAdmin
                  ? current?.id === "basic"
                    ? "Upgrade to Pro to manage billing"
                    : "No billing customer available"
                  : "Organization admins only"}
              </span>
            )}
          </div>
        </div>}
      </div>
    </div>
  );
}
