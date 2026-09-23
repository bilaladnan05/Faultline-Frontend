import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { hasProjectAccess } from "../auth/roles";

const ProjectContext = createContext(null);

const STORAGE_KEY = "fl_active_project";

function readStoredProject() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const projectIdOf = (project) => project?.clusterId ?? project?.id ?? null;

export function ProjectProvider({ children }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(readStoredProject);

  const clearActiveProject = useCallback(() => {
    setSelected(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to do */
    }
  }, []);

  const setActiveProject = useCallback((project) => {
    setSelected(project);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      /* the selection simply will not survive a reload */
    }
  }, []);

  /**
   * A selection the current user may not open counts as no selection.
   *
   * Derived rather than corrected in an effect: the selection survives a sign-out in
   * sessionStorage and an assignment can be revoked while it is held, so the check has
   * to run on every render against the current identity. Computing it keeps a stale
   * value from ever being handed out, where clearing it afterwards would show it once.
   *
   * This only keeps the UI coherent. The data behind the selection was never reachable
   * either way — the API scopes every request by assignment, whatever is selected here.
   */
  const accessible = !!selected && hasProjectAccess(user, projectIdOf(selected));
  const activeProject = accessible ? selected : null;

  // Storage is the external system this syncs to, so tidying it belongs in an effect.
  useEffect(() => {
    if (selected && !accessible) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* nothing to do */
      }
    }
  }, [selected, accessible]);

  const value = useMemo(
    () => ({ activeProject, setActiveProject, clearActiveProject }),
    [activeProject, setActiveProject, clearActiveProject],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  return useContext(ProjectContext);
}
