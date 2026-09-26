import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { RequireAuth, RequirePasswordChanged, RequireRole } from "../auth/guards";
import { ROLES } from "../auth/roles";
import AppLayout from "../components/layout/AppLayout";
import AlertsPage from "../pages/AlertsPage";
import DeploymentsPage from "../pages/DeploymentsPage";
import IncidentDetailPage from "../pages/IncidentDetailPage";
import IncidentsListPage from "../pages/IncidentsListPage";
import IntegrationsPage from "../pages/IntegrationsPage";
import LedgerPage from "../pages/LedgerPage";
import PRIssuancePage from "../pages/PRIssuancePage";
import ReportingPage from "../pages/ReportingPage";
import RuntimeMonitoringPage from "../pages/RuntimeMonitoringPage";
import TeamRolesPage from "../pages/TeamRolesPage";
import VoiceAgentPage from "../pages/VoiceAgentPage";
import { ProjectProvider } from "../context/ProjectContext";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import ForbiddenPage from "../pages/ForbiddenPage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import PaymentReturnPage from "../pages/PaymentReturnPage";
import SubscribePage from "../pages/SubscribePage";
import ClusterOnboardingPage from "../pages/ClusterOnboardingPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/subscribe" element={<SubscribePage />} />
            <Route
              path="/payment/success"
              element={<PaymentReturnPage outcome="success" />}
            />
            <Route
              path="/payment/cancel"
              element={<PaymentReturnPage outcome="cancel" />}
            />
            <Route
              path="/change-password"
              element={
                <RequireAuth>
                  <ChangePasswordPage />
                </RequireAuth>
              }
            />
            <Route
              element={
                <RequireAuth>
                  <RequirePasswordChanged>
                    <AppLayout />
                  </RequirePasswordChanged>
                </RequireAuth>
              }
            >
              <Route
                path="onboarding"
                element={
                  <RequireRole roles={[ROLES.ADMIN]}>
                    <ClusterOnboardingPage />
                  </RequireRole>
                }
              />
              <Route path="dashboard" element={<Navigate to="/deployments" replace />} />
              <Route path="incidents" element={<IncidentsListPage />} />
              <Route path="incidents/:id" element={<IncidentDetailPage />} />
              <Route path="incidents/:id/pr" element={<PRIssuancePage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="deployments" element={<DeploymentsPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="runtime" element={<RuntimeMonitoringPage />} />
              <Route path="ledger" element={<LedgerPage />} />
              <Route path="reporting" element={<ReportingPage />} />
              <Route path="voice-agent" element={<VoiceAgentPage />} />
              <Route path="team" element={<TeamRolesPage />} />
              <Route path="forbidden" element={<ForbiddenPage />} />
              <Route path="*" element={<Navigate to="/deployments" replace />} />
            </Route>
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
