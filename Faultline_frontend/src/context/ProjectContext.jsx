import { useState, useCallback } from "react";
import { ProjectContext } from "./project-context";

function readStoredProject() {
  try {
    const raw = sessionStorage.getItem("fl_active_project");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ProjectProvider({ children }) {
  const [activeProject, setActiveProjectState] = useState(readStoredProject);

  const setActiveProject = useCallback((project) => {
    setActiveProjectState(project);
    sessionStorage.setItem("fl_active_project", JSON.stringify(project));
  }, []);

  const clearActiveProject = useCallback(() => {
    setActiveProjectState(null);
    sessionStorage.removeItem("fl_active_project");
  }, []);

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, clearActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}
