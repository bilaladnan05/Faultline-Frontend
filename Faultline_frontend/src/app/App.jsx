import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LandingPage from "../pages/LandingPage";
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
import ForbiddenPage from "../pages/ForbiddenPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAuditPage from "../pages/admin/AdminAuditPage";
import { ProjectProvider, useProject } from "../context/ProjectContext";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { RequireAuth, RequireProjectAccess, RequireRole } from "../auth/guards";
import { ROLES } from "../auth/roles";

/**
 * Project-workspace pages only make sense once a project has been opened from the
 * project list. Unchanged in spirit from before; what changed is that the list it sends
 * people back to now contains only the projects they are allowed to open.
 */
function RequireProject({ children }) {
  const { activeProject } = useProject();
  return activeProject ? children : <Navigate to="/projects" replace />;
}

function DefaultRedirect() {
  const { activeProject } = useProject();
  return <Navigate to={activeProject ? "/dashboard" : "/projects"} replace />;
}

/** Signed-in users have no reason to see the marketing page or the login form again. */
function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return children;
  return isAuthenticated ? <Navigate to="/projects" replace /> : children;
}

/**
 * Routing and its guards.
 *
 * Three kinds of protection are layered here, and none of them is the security boundary
 * — the API enforces all three independently on every request:
 *
 *   RequireAuth           there is a verified session
 *   RequireRole           the role may reach this area at all (the /admin subtree)
 *   RequireProjectAccess  this user is assigned to the project named in the URL
 *
 * The last is what makes editing `/projects/project-a` to `/projects/project-b` in the
 * address bar land on the forbidden page. Deleting it would not expose project B: the
 * API would still answer 403 to every request the page then made.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes. "/" is the marketing page every visitor lands on. */}
      <Route
        path="/"
        element={
          <PublicOnly>
            <LandingPage />
          </PublicOnly>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route path="/mfa" element={<MFAPage />} />

      {/* Authenticated app shell — a pathless layout route, so "/" stays public */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        {/* Org-level — no project selection required */}
        <Route path="/projects" element={<DeploymentsPage />} />
        {/* The old path, kept so existing links and bookmarks still work. */}
        <Route path="/deployments" element={<Navigate to="/projects" replace />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Opening one project by id: the route an engineer might try to edit. */}
        <Route
          path="/projects/:projectId"
          element={
            <RequireProjectAccess>
              <DashboardPage />
            </RequireProjectAccess>
          }
        />
        <Route
          path="/projects/:projectId/incidents"
          element={
            <RequireProjectAccess>
              <IncidentsListPage />
            </RequireProjectAccess>
          }
        />

        {/* Administration — Admin only, both here and at the API. */}
        <Route
          path="/admin/users"
          element={
            <RequireRole roles={[ROLES.ADMIN]}>
              <AdminUsersPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RequireRole roles={[ROLES.ADMIN]}>
              <AdminAuditPage />
            </RequireRole>
          }
        />
        <Route path="/admin/projects" element={<Navigate to="/projects" replace />} />
        <Route
          path="/team"
          element={
            <RequireRole roles={[ROLES.ADMIN]}>
              <TeamRolesPage />
            </RequireRole>
          }
        />
        <Route
          path="/subscription"
          element={
            <RequireRole roles={[ROLES.ADMIN]}>
              <SubscriptionPage />
            </RequireRole>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireRole roles={[ROLES.ADMIN]}>
              <SettingsPage />
            </RequireRole>
          }
        />

        {/* Project workspace — requires a project opened from the list */}
        <Route path="/dashboard" element={<RequireProject><DashboardPage /></RequireProject>} />
        <Route path="/incidents" element={<RequireProject><IncidentsListPage /></RequireProject>} />
        <Route path="/incidents/:id" element={<RequireProject><IncidentDetailPage /></RequireProject>} />
        <Route path="/incidents/:id/pr" element={<RequireProject><PRIssuancePage /></RequireProject>} />
        <Route path="/alerts" element={<RequireProject><AlertsPage /></RequireProject>} />
        <Route
          path="/integrations"
          element={
            <RequireRole roles={[ROLES.ADMIN]}>
              <RequireProject>
                <IntegrationsPage />
              </RequireProject>
            </RequireRole>
          }
        />
        <Route path="/runtime" element={<RequireProject><RuntimeMonitoringPage /></RequireProject>} />
        <Route path="/ledger" element={<RequireProject><LedgerPage /></RequireProject>} />
        <Route path="/reporting" element={<RequireProject><ReportingPage /></RequireProject>} />
        <Route path="/voice-agent" element={<RequireProject><VoiceAgentPage /></RequireProject>} />

        <Route path="*" element={<DefaultRedirect />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Auth wraps projects: the project selection is validated against the identity,
          so the identity has to exist first. */}
      <AuthProvider>
        <ProjectProvider>
          <AppRoutes />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
