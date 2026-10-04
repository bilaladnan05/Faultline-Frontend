import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { RequireAuth, RequireFeature, RequirePasswordChanged, RequireRole } from "../auth/guards";
import { FEATURES } from "../auth/plans";
import { ROLES } from "../auth/roles";
import AppLayout from "../components/layout/AppLayout";
import AlertsPage from "../pages/AlertsPage";
import DeploymentsPage from "../pages/DeploymentsPage";
import IncidentDetailPage from "../pages/IncidentDetailPage";
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
                path="clusters/onboarding"
                element={
                  <RequireRole roles={[ROLES.ADMIN]}>
                    <ClusterOnboardingPage />
                  </RequireRole>
                }
              />
              <Route path="clusters" element={<DeploymentsPage />} />
              <Route path="onboarding" element={<Navigate to="/clusters/onboarding" replace />} />
              <Route path="deployments" element={<Navigate to="/clusters" replace />} />
              <Route path="dashboard" element={<Navigate to="/clusters" replace />} />
              {/* The Incident Ledger is the incidents list; the old address still lands. */}
              <Route path="incidents" element={<Navigate to="/ledger" replace />} />
              <Route path="incidents/:id" element={<IncidentDetailPage />} />
              {/* Basic pages (clusters, onboarding, incidents, alerts, ledger) are on every
                  plan; the rest are gated by tier here and, independently, by the API. */}
              <Route
                path="incidents/:id/pr"
                element={
                  <RequireFeature feature={FEATURES.AUTO_REMEDIATION}>
                    <PRIssuancePage />
                  </RequireFeature>
                }
              />
              <Route path="alerts" element={<AlertsPage />} />
              <Route
                path="integrations"
                element={
                  <RequireFeature feature={FEATURES.INTEGRATIONS}>
                    <IntegrationsPage />
                  </RequireFeature>
                }
              />
              <Route
                path="runtime"
                element={
                  <RequireFeature feature={FEATURES.LOG_AGGREGATOR}>
                    <RuntimeMonitoringPage />
                  </RequireFeature>
                }
              />
              <Route path="ledger" element={<LedgerPage />} />
              <Route
                path="reporting"
                element={
                  <RequireFeature feature={FEATURES.REPORTING}>
                    <ReportingPage />
                  </RequireFeature>
                }
              />
              <Route
                path="voice-agent"
                element={
                  <RequireRole roles={[ROLES.ADMIN]}>
                    <RequireFeature feature={FEATURES.VOICE_AGENT}>
                      <VoiceAgentPage />
                    </RequireFeature>
                  </RequireRole>
                }
              />
              <Route
                path="team"
                element={
                  <RequireRole roles={[ROLES.ADMIN]}>
                    <RequireFeature feature={FEATURES.TEAM_MANAGEMENT}>
                      <TeamRolesPage />
                    </RequireFeature>
                  </RequireRole>
                }
              />
              <Route path="forbidden" element={<ForbiddenPage />} />
              <Route path="*" element={<Navigate to="/clusters" replace />} />
            </Route>
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
