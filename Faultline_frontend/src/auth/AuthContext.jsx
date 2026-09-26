/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, setToken, setUnauthorizedHandler } from "../api/client";
import {
  changePassword as changePasswordRequest,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "../api/endpoints";
import { hasPermission, hasProjectAccess, hasRole, isAdmin } from "./roles";

const AuthContext = createContext(null);

/**
 * Where the session lives.
 *
 * `sessionStorage`, so the token dies with the tab and is not shared between them. It
 * is still readable by any script running on this origin, which is the known cost of a
 * bearer token in a SPA; the backend is written so that an httpOnly session cookie can
 * replace this without the rest of the app noticing.
 */
const TOKEN_KEY = "fl_token";
const USER_KEY = "fl_user";

function readStored(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(token, user) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    else sessionStorage.removeItem(TOKEN_KEY);
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
  } catch {
    // A browser refusing storage is not a reason to fail the login; the session simply
    // will not survive a reload.
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => readStored(TOKEN_KEY));
  const [user, setUser] = useState(() => readStored(USER_KEY));
  // A stored session is unverified until `/auth/me` confirms it, so the first paint
  // waits rather than briefly showing an app the token may no longer open.
  const [loading, setLoading] = useState(() => !!readStored(TOKEN_KEY));

  const signOut = useCallback((reason) => {
    clearToken();
    persist(null, null);
    setTokenState(null);
    setUser(null);
    if (reason) {
      try {
        sessionStorage.setItem("fl_signout_reason", reason);
      } catch {
        /* nothing to do */
      }
    }
  }, []);

  // The API layer calls this when any request comes back 401 — an expired token, a
  // disabled account, a rotated signing secret. One place, so every screen reacts the
  // same way instead of each handling it.
  useEffect(() => {
    setUnauthorizedHandler(() => signOut("expired"));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    if (token) setToken(token);
  }, [token]);

  // Re-reads the identity on mount so role and project assignments reflect what the
  // server thinks now, not what it thought when the token was issued.
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    const controller = new AbortController();
    setToken(token);
    getCurrentUser({ signal: controller.signal })
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        persist(token, fresh);
      })
      .catch((error) => {
        if (cancelled || error?.name === "AbortError") return;
        // 401 has already signed the user out through the handler above. Anything else
        // is the API being unreachable, which must not destroy a valid session.
        if (error?.status === 401) return;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
    // Runs for each new token; `signOut` is stable.
  }, [token]);

  const signIn = useCallback(async (email, password) => {
    const session = await loginRequest(email, password);
    setToken(session.accessToken);
    setTokenState(session.accessToken);
    setUser(session.user);
    persist(session.accessToken, session.user);
    setLoading(false);
    return session.user;
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
    setToken(refreshed.accessToken);
    setTokenState(refreshed.accessToken);
    setUser(refreshed.user);
    persist(refreshed.accessToken, refreshed.user);
    return refreshed.user;
  }, []);

  const signOutRemote = useCallback(async () => {
    // Best effort: the audit record matters, but a failed call must not strand the
    // user in a session they asked to leave.
    try {
      await logoutRequest();
    } catch {
      /* ignored on purpose */
    }
    signOut();
  }, [signOut]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      /**
       * The account holds a temporary password it has not replaced.
       *
       * Used to route the user to the change-password screen. It is a convenience: the
       * API refuses every other route for such an account regardless of what this says.
       */
      mustChangePassword: user?.mustChangePassword === true,
      signIn,
      signOut: signOutRemote,
      changePassword,
      isAdmin: isAdmin(user),
      hasRole: (...roles) => hasRole(user, ...roles),
      can: (permission) => hasPermission(user, permission),
      canAccessProject: (projectId) => hasProjectAccess(user, projectId),
    }),
    [user, token, loading, signIn, signOutRemote, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
