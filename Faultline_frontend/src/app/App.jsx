import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import MFAPage from "../pages/MFAPage";
import DashboardPage from "../pages/DashboardPage";
import IncidentsListPage from "../pages/IncidentsListPage";
import IncidentDetailPage from "../pages/IncidentDetailPage";
import PRIssuancePage from "../pages/PRIssuancePage";
import IntegrationsPage from "../pages/IntegrationsPage";
import RuntimeMonitoringPage from "../pages/RuntimeMonitoringPage";
import LedgerPage from "../pages/LedgerPage";
import ReportingPage from "../pages/ReportingPage";
import VoiceAgentPage from "../pages/VoiceAgentPage";
import SubscriptionPage from "../pages/SubscriptionPage";
import TeamRolesPage from "../pages/TeamRolesPage";
import AlertsPage from "../pages/AlertsPage";
import DeploymentsPage from "../pages/DeploymentsPage";
import SettingsPage from "../pages/SettingsPage";
import { ProjectProvider } from "../context/ProjectContext";
import { useProject } from "../context/useProject";

function getAuth() {
  return sessionStorage.getItem("fl_auth") === "ok";
}

function RequireAuth({ children }) {
  return getAuth() ? children : <Navigate to="/login" replace />;
}

// Project-workspace pages (dashboard, incidents, runtime, etc.) only make sense
// once a deployment has been selected via "Manage" on the Deployments page.
function RequireProject({ children }) {
  const { activeProject } = useProject();
  return activeProject ? children : <Navigate to="/deployments" replace />;
}

function DefaultRedirect() {
  const { activeProject } = useProject();
  return <Navigate to={activeProject ? "/dashboard" : "/deployments"} replace />;
}

export default function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mfa" element={<MFAPage />} />

          {/* Authenticated app shell */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DefaultRedirect />} />

            {/* Org-level — no project selection required */}
            <Route path="deployments" element={<DeploymentsPage />} />
            <Route path="team" element={<TeamRolesPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Project workspace — requires a deployment selected via "Manage" */}
            <Route path="dashboard" element={<RequireProject><DashboardPage /></RequireProject>} />
            <Route path="incidents" element={<RequireProject><IncidentsListPage /></RequireProject>} />
            <Route path="incidents/:id" element={<RequireProject><IncidentDetailPage /></RequireProject>} />
            <Route path="incidents/:id/pr" element={<RequireProject><PRIssuancePage /></RequireProject>} />
            <Route path="alerts" element={<RequireProject><AlertsPage /></RequireProject>} />
            <Route path="integrations" element={<RequireProject><IntegrationsPage /></RequireProject>} />
            <Route path="runtime" element={<RequireProject><RuntimeMonitoringPage /></RequireProject>} />
            <Route path="ledger" element={<RequireProject><LedgerPage /></RequireProject>} />
            <Route path="reporting" element={<RequireProject><ReportingPage /></RequireProject>} />
            <Route path="voice-agent" element={<RequireProject><VoiceAgentPage /></RequireProject>} />

            <Route path="*" element={<DefaultRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
