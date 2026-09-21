import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { hasProjectAccess, hasRole } from "./roles";

/**
 * Route guards.
 *
 * These decide what this browser will *render*. They are not the security boundary:
 * every route behind them reaches the API, and the API applies the same role and
 * assignment rules to each request. Removing a guard here would make the UI show an
 * empty, erroring screen - not leak anyone's data.
 *
 * Their job is to make the app honest: a user should not be offered a door that will be
 * slammed in their face, and an engineer who edits a project id in the URL should get a
 * clear "not yours" rather than a page of failed requests.
 */

/** A full-page wait, so a stored session is verified before anything is decided. */
function Verifying() {
  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        Restoring your session…
      </div>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Verifying />;
  // `state` carries where they were headed, so signing in resumes rather than restarts.
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}

/**
 * Holds an account that still owes a password change on the change-password screen.
 *
 * Wrapped around the whole authenticated shell rather than sprinkled over individual
 * routes, so a page added later is covered without anyone remembering to cover it.
 *
 * As with every guard here, this is not the enforcement. An account in this state is
 * refused by the API on every route but `/auth/me`, `/auth/logout` and
 * `/auth/change-password`, so skipping this redirect buys a user nothing except a
 * screen full of 403s. What it buys *us* is that the user is told what to do.
 */
export function RequirePasswordChanged({ children }) {
  const { isAuthenticated, mustChangePassword, loading } = useAuth();
  if (loading) return <Verifying />;
  if (isAuthenticated && mustChangePassword)
    return <Navigate to="/change-password" replace />;
  return children;
}

/**
 * Restricts a subtree to the listed roles.
 *
 * Renders the forbidden page rather than redirecting to the dashboard: a user who typed
 * `/admin/users` deserves to be told it is not theirs, not silently moved somewhere else
 * and left wondering whether the click registered.
 */
export function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Verifying />;
  return hasRole(user, ...roles) ? children : <Navigate to="/forbidden" replace />;
}

/**
 * Guards a project workspace against the project named in the URL.
 *
 * This is the client half of scenario 3: editing `/projects/project-a` to
 * `/projects/project-b` lands here first. The API refuses the same request independently
 * — see the 403 that `useProjectAccess` surfaces when data is actually fetched.
 */
export function RequireProjectAccess({ children }) {
  const { user, loading } = useAuth();
  const { projectId } = useParams();
  if (loading) return <Verifying />;
  if (!projectId) return children;
  return hasProjectAccess(user, projectId) ? (
    children
  ) : (
    <Navigate to="/forbidden" replace state={{ projectId }} />
  );
}

/** Renders children only when the permission is held. Used for buttons, not routes. */
export function Can({ permission, children, fallback = null }) {
  const { can } = useAuth();
  return can(permission) ? children : fallback;
}
