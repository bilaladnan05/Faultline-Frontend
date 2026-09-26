import { useCallback, useMemo, useState } from "react";
import { ProjectContext } from "./project-context";

const STORAGE_KEY = "fl_active_project";

function readStoredProject() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Keeps the selected cluster available to telemetry pages. Authorization remains API-owned. */
export function ProjectProvider({ children }) {
  const [activeProject, setSelected] = useState(readStoredProject);
  const setActiveProject = useCallback((project) => {
    setSelected(project);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(project)); } catch { /* optional persistence */ }
  }, []);
  const clearActiveProject = useCallback(() => {
    setSelected(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* optional persistence */ }
  }, []);
  const value = useMemo(() => ({ activeProject, setActiveProject, clearActiveProject }), [activeProject, setActiveProject, clearActiveProject]);
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
