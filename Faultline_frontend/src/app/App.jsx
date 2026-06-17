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

function getAuth() {
  return sessionStorage.getItem("fl_auth") === "ok";
}

function RequireAuth({ children }) {
  return getAuth() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="incidents" element={<IncidentsListPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          <Route path="incidents/:id/pr" element={<PRIssuancePage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="runtime" element={<RuntimeMonitoringPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="reporting" element={<ReportingPage />} />
          <Route path="voice-agent" element={<VoiceAgentPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="team" element={<TeamRolesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
