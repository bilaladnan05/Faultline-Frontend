import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { listPlans } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { lockFor } from "../auth/plans";
import { useApiResource } from "../hooks/useApiResource";

/**
 * Where a module the organization's plan does not include lands.
 *
 * Deliberately not the forbidden page: the person has done nothing wrong, their plan
 * simply does not carry this module, so this says which plan does and who can change
 * it. The API refuses the module's routes independently, so this is the explanation,
 * not the lock.
 */
export default function PlanLockedPage({ feature }) {
  const { entitlements, isAdmin } = useAuth();
  const lock = lockFor(entitlements, feature);
  const label = lock?.label ?? "This page";
  const requiredPlan = lock?.requiredPlanName ?? "a higher plan";
  // Plan changes are not self-serve yet, so an admin is pointed at whoever sells them.
  const plans = useApiResource(({ signal }) => listPlans({ signal }), [], { enabled: isAdmin });
  const salesContact = plans.data?.salesContact ?? null;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto">
          <Lock size={22} className="text-amber-600" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mt-4">
          {label} is part of the {requiredPlan} plan
        </h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Your organization is on the{" "}
          <span className="font-semibold text-gray-700">{entitlements?.planName ?? "current"}</span> plan,
          which does not include {label}.{" "}
          {isAdmin
            ? `Upgrade to ${requiredPlan} to unlock it.`
            : `Ask your organization's administrator to upgrade to ${requiredPlan}.`}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {isAdmin && salesContact && (
            <a
              href={`mailto:${salesContact}?subject=${encodeURIComponent(`Upgrade to ${requiredPlan}`)}`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Mail size={14} /> Contact sales to upgrade
            </a>
          )}
          <Link
            to="/clusters"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} /> Back to clusters
          </Link>
        </div>
      </div>
    </div>
  );
}
