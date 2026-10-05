import { useMemo } from "react";
import { listClusters } from "../api/endpoints";
import TopBar from "../components/layout/TopBar";
import OnsiteEngineersCard from "../components/team/OnsiteEngineersCard";
import { ErrorState, StaleBanner } from "../components/ui/AsyncState";
import { useApiResource } from "../hooks/useApiResource";

/**
 * Onsite engineer accounts and the clusters each one can see. Admin only, here and at
 * the API. The cluster list is the signed-in admin's own: `/clusters` is scoped to the
 * caller's organization and project assignments.
 */
export default function TeamRolesPage() {
  const clusters = useApiResource(({ signal }) => listClusters({ signal }), []);
  const clusterList = useMemo(() => clusters.data ?? [], [clusters.data]);

  return (
    <div className="flex flex-col flex-1">
      <TopBar breadcrumbs={["Administration", "Team & Roles"]} />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team & Roles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create onsite engineer accounts and choose which of your clusters each one can see.
          </p>
        </div>

        {clusters.error && !clusters.data ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <ErrorState error={clusters.error} onRetry={clusters.refetch} className="py-8" />
          </div>
        ) : (
          <StaleBanner error={clusters.error} onRetry={clusters.refetch} />
        )}
        <OnsiteEngineersCard clusters={clusterList} />
      </main>
    </div>
  );
}
