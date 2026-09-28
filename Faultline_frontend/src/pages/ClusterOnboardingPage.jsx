import { Link } from "react-router-dom";
import ClusterOnboardingForm from "../components/clusters/ClusterOnboardingForm";
import TopBar from "../components/layout/TopBar";

export default function ClusterOnboardingPage() {
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

          <ClusterOnboardingForm />
        </div>
      </main>
    </div>
  );
}
