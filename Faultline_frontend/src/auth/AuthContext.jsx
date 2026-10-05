/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setUnauthorizedHandler } from "../api/client";
import {
  changePassword as changePasswordRequest,
  getCurrentUser,
  getEntitlements,
  login as loginRequest,
  logout as logoutRequest,
  verifyMfaLogin,
} from "../api/endpoints";
import { planIncludes } from "./plans";
import { hasPermission, hasProjectAccess, hasRole, isAdmin } from "./roles";

const AuthContext = createContext(null);

/**
 * Authentication is held by the API in an HttpOnly cookie. JavaScript keeps only the
 * current user's non-secret presentation data, and re-reads it after every page load.
 */
/**
 * The account's tier, or null when it cannot be read. Null means "unknown", which the
 * UI treats as "offer the page and let the API decide" rather than hiding everything.
 */
async function readEntitlements(signal) {
  try {
    return await getEntitlements({ signal });
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback((reason) => {
    setUser(null);
    setEntitlements(null);
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
      .then(async (fresh) => {
        if (cancelled) return;
        setUser(fresh);
        if (fresh.mustChangePassword) return;
        const granted = await readEntitlements(controller.signal);
        if (!cancelled) setEntitlements(granted);
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

  const adoptSession = useCallback(async (session) => {
    // Before the session is adopted, so the first screen after sign-in is already
    // drawn for the right tier rather than redrawn a moment later.
    const granted = session.user?.mustChangePassword ? null : await readEntitlements();
    setEntitlements(granted);
    setUser(session.user);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email, password) => {
    const session = await loginRequest(email, password);
    if (session.mfaRequired) return session;
    await adoptSession(session);
    return session.user;
  }, [adoptSession]);

  const completeMfaSignIn = useCallback(async (challengeToken, code) => {
    const session = await verifyMfaLogin(challengeToken, code);
    await adoptSession(session);
    return session.user;
  }, [adoptSession]);

  const refreshUser = useCallback(async () => {
    const fresh = await getCurrentUser();
    setUser(fresh);
    return fresh;
  }, []);

  /**
   * Replaces the password and, for a provisioned admin, ends the confinement.
   *
   * The refreshed session the API returns is adopted here rather than re-fetching:
   * `mustChangePassword` flips in the same response, so the guards release on the very
   * next render instead of after a round trip.
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const refreshed = await changePasswordRequest(currentPassword, newPassword);
    setEntitlements(await readEntitlements());
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
      mfaEnrollmentRequired: user?.mfaEnrollmentRequired === true,
      signIn,
      completeMfaSignIn,
      refreshUser,
      signOut: signOutRemote,
      changePassword,
      isAdmin: isAdmin(user),
      hasRole: (...roles) => hasRole(user, ...roles),
      can: (permission) => hasPermission(user, permission),
      canAccessProject: (projectId) => hasProjectAccess(user, projectId),
      /** The organization's tier as the API reports it; null until known. */
      entitlements,
      /** Whether the tier includes a module. A courtesy: the API enforces the same rule. */
      hasFeature: (feature) => planIncludes(entitlements, feature),
    }),
    [user, loading, entitlements, signIn, completeMfaSignIn, refreshUser, signOutRemote, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
