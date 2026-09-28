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
  // Only read when the plan has an allowance to compare against.
  const clusters = useApiResource(({ signal }) => listClusters({ signal }), [], {
    enabled: limit !== null,
  });
  const used = clusters.data?.length ?? 0;
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
            {limit !== null && (
              <p className="mt-2 text-xs font-semibold text-gray-500">
                {entitlements.planName} plan: {used} of {limit} cluster{limit === 1 ? "" : "s"} used
              </p>
            )}
          </header>

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
