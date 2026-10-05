import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setUnauthorizedHandler } from "../api/client";
import {
  changePassword as changePasswordRequest,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "../api/endpoints";
import { hasPermission, hasProjectAccess, hasRole, isAdmin } from "./roles";

const AuthContext = createContext(null);

/**
 * Authentication is held by the API in an HttpOnly cookie. JavaScript keeps only the
 * current user's non-secret presentation data, and re-reads it after every page load.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback((reason) => {
    setUser(null);
    if (reason) {
      try {
        sessionStorage.setItem("fl_signout_reason", reason);
      } catch {
        /* nothing to do */
      }
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut("expired"));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // The browser sends the HttpOnly cookie itself; `/auth/me` determines whether a
  // server-side session survived the reload and refreshes current role/assignment data.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // Remove credentials left by versions that stored bearer tokens in this tab.
    try {
      sessionStorage.removeItem("fl_token");
      sessionStorage.removeItem("fl_user");
    } catch {
      /* Storage may be disabled. */
    }
    getCurrentUser({ signal: controller.signal, auth: false })
      .then((fresh) => {
        if (!cancelled) setUser(fresh);
      })
      .catch((error) => {
        if (cancelled || error?.name === "AbortError" || error?.status === 401) return;
        // A network outage must not be mistaken for an explicit logout.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const session = await loginRequest(email, password);
    setUser(session.user);
    setLoading(false);
    return session.user;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const refreshed = await changePasswordRequest(currentPassword, newPassword);
    setUser(refreshed.user);
    return refreshed.user;
  }, []);

  const signOutRemote = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* Local state still ends even if the network is unavailable. */
    }
    signOut();
  }, [signOut]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      mustChangePassword: user?.mustChangePassword === true,
      signIn,
      signOut: signOutRemote,
      changePassword,
      isAdmin: isAdmin(user),
      hasRole: (...roles) => hasRole(user, ...roles),
      can: (permission) => hasPermission(user, permission),
      canAccessProject: (projectId) => hasProjectAccess(user, projectId),
    }),
    [user, loading, signIn, signOutRemote, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
