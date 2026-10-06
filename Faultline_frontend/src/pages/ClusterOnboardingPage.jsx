import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { listClusters } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { clusterLimit } from "../auth/plans";
import ClusterOnboardingForm from "../components/clusters/ClusterOnboardingForm";
import TopBar from "../components/layout/TopBar";
import { LoadingState } from "../components/ui/AsyncState";
import { useApiResource } from "../hooks/useApiResource";

export default function ClusterOnboardingPage() {
  const { entitlements } = useAuth();
  const limit = clusterLimit(entitlements);
  // Keep the count live after a successful onboarding. The entitlements response is a
  // useful initial value while the cluster directory is loading.
  const clusters = useApiResource(({ signal }) => listClusters({ signal }), []);
  const used = clusters.data?.length ?? entitlements?.usage?.clusters ?? 0;
  const usagePercent = limit === null
    ? null
    : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  // The API refuses a cluster past the allowance before installing anything; this
  // just says so up front instead of offering a form that can only be refused. If the
  // count cannot be read, the form is offered and the API has the final word.
  const checking = limit !== null && !clusters.data && !clusters.error;
  const atLimit = limit !== null && Boolean(clusters.data) && used >= limit;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        breadcrumbs={["Clusters", "Cluster Onboarding"]}
        action={<Link to="/clusters" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50">View onboarded clusters</Link>}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <header>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Cluster setup</span>
            <h1 className="mt-3 text-xl font-bold text-gray-900">Connect a Kubernetes cluster</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Onboard one cluster at a time. The form resets after each successful connection so you can add another.</p>
          </header>

          <section aria-label="Cluster allowance" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-gray-900">Cluster allowance</h2>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {entitlements?.planName ?? "Current"} plan
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                {limit === null
                  ? "Your current plan has no cluster limit."
                  : used >= limit
                    ? "Your cluster allowance is fully used. Upgrade or remove a cluster before adding another."
                    : `${limit - used} cluster slot${limit - used === 1 ? "" : "s"} remaining.`}
              </p>
              <span className="text-sm font-bold text-gray-900">
                {used.toLocaleString()} / {limit === null ? "Unlimited" : limit.toLocaleString()}
              </span>
            </div>
            {usagePercent !== null && (
              <div
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100"
                role="progressbar"
                aria-label="Cluster allowance used"
                aria-valuemin="0"
                aria-valuemax={limit}
                aria-valuenow={used}
              >
                <div
                  className={`h-full rounded-full transition-all ${used >= limit ? "bg-red-500" : "bg-blue-500"}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </section>

          {checking ? (
            <LoadingState label="Checking your plan's cluster allowance…" />
          ) : atLimit ? (
            <ClusterLimitNotice planName={entitlements.planName} limit={limit} />
          ) : (
            <ClusterOnboardingForm onSuccess={clusters.refetch} />
          )}
        </div>
      </main>
    </div>
  );
}

function ClusterLimitNotice({ planName, limit }) {
  return (
    <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <Lock size={18} className="mt-0.5 shrink-0 text-amber-600" />
      <div>
        <h2 className="text-sm font-bold text-amber-900">
          Your {planName} plan includes {limit} cluster{limit === 1 ? "" : "s"}, and it is in use
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-amber-800">
          Upgrade to Pro to connect more clusters. To monitor a different cluster instead, uninstall the current
          one from{" "}
          <Link to="/clusters" className="font-semibold underline">
            Onboarded Clusters
          </Link>{" "}
          first.
        </p>
      </div>
    </section>
  );
}
