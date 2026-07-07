import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ProjectInfo {
  key: string;
  name: string;
  shortName: string;
  logo: string; // path to SVG in /public
}

export const PROJECTS: ProjectInfo[] = [
  {
    key: "ARCADIA_PREMIUM",
    name: "Praneeth Arcadia Premium",
    shortName: "Arcadia Premium",
    logo: "/arcadia-logo.png",
  },
  {
    key: "REDFERN_SQUARE",
    name: "Praneeth Redfern Square",
    shortName: "Redfern Square",
    logo: "/logo-redfern-square.svg",
  },
  {
    key: "AALAYA_ARVINDHAM",
    name: "Aalaya Arvindham",
    shortName: "Aalaya Arvindham",
    logo: "/logo-aalaya-arvindham.svg",
  },
];

interface ProjectContextValue {
  /** Currently selected project (global default) */
  selectedProject: ProjectInfo;
  /** Set the global project selection */
  setSelectedProject: (project: ProjectInfo) => void;
  /** Page-level override — if set, takes precedence over global for logos/prints */
  pageProject: ProjectInfo | null;
  /** Pages with a project field can call this to override the global selection */
  setPageProject: (project: ProjectInfo | null) => void;
  /** The effective project (pageProject ?? selectedProject) used for logos, prints, etc. */
  activeProject: ProjectInfo;
  /** Get a ProjectInfo by key */
  getProjectByKey: (key: string) => ProjectInfo | undefined;
  /** Get a ProjectInfo by name (fuzzy match on name or shortName) */
  getProjectByName: (name: string) => ProjectInfo | undefined;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProject, setSelectedProject] = useState<ProjectInfo>(PROJECTS[0]);
  const [pageProject, setPageProject] = useState<ProjectInfo | null>(null);

  const activeProject = pageProject ?? selectedProject;

  const getProjectByKey = useCallback((key: string) => {
    return PROJECTS.find((p) => p.key === key);
  }, []);

  const getProjectByName = useCallback((name: string) => {
    const lower = name.toLowerCase();
    return PROJECTS.find(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.shortName.toLowerCase().includes(lower) ||
        lower.includes(p.shortName.toLowerCase())
    );
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        selectedProject,
        setSelectedProject,
        pageProject,
        setPageProject,
        activeProject,
        getProjectByKey,
        getProjectByName,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within <ProjectProvider>");
  return ctx;
}
