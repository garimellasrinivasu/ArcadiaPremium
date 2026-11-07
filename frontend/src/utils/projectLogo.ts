/**
 * Utility to resolve project logos for printing, saving, and display.
 *
 * Pages that have their own project selector can pass the project name/key
 * to get the matching logo. Otherwise, use the global ProjectContext.
 */

import { useEffect } from "react";
import { PROJECTS, useProject, type ProjectInfo } from "../contexts/ProjectContext";

/** Map of project key → logo path for quick lookup */
const LOGO_MAP: Record<string, string> = {};
PROJECTS.forEach((p) => {
  LOGO_MAP[p.key] = p.logo;
});

/**
 * Get the logo URL for a project by its key (e.g. "ARCADIA_PREMIUM").
 * Falls back to the first project's logo if key is not found.
 */
export function getLogoByKey(key: string): string {
  return LOGO_MAP[key] ?? PROJECTS[0].logo;
}

/**
 * Get the ProjectInfo for a project by its database name (e.g. "Praneeth Arcadia Premium").
 * Does a case-insensitive partial match against name and shortName.
 */
export function getProjectByName(name: string): ProjectInfo | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return PROJECTS.find(
    (p) =>
      p.name.toLowerCase() === lower ||
      p.shortName.toLowerCase() === lower ||
      p.name.toLowerCase().includes(lower) ||
      lower.includes(p.shortName.toLowerCase())
  );
}

/**
 * Get logo URL for a project by its database name.
 * Falls back to the first project's logo.
 */
export function getLogoByName(name: string): string {
  const proj = getProjectByName(name);
  return proj?.logo ?? PROJECTS[0].logo;
}

/**
 * All available project keys for iteration.
 */
export const PROJECT_KEYS = PROJECTS.map((p) => p.key);

/**
 * Keeps a page's own project dropdown in step with the project logos in the header:
 * clicking a header logo switches the page, and choosing in the dropdown highlights the header logo.
 * Returns the function to call when the dropdown changes.
 */
export function useHeaderProjectSync(names: string[], current: string, setCurrent: (name: string) => void) {
  const { selectedProject, setSelectedProject } = useProject();

  useEffect(() => {
    const match = names.find((n) => getProjectByName(n)?.key === selectedProject.key);
    if (match && match !== current) setCurrent(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject.key, names.join("|")]);

  return (name: string) => {
    setCurrent(name);
    const proj = getProjectByName(name);
    if (proj && proj.key !== selectedProject.key) setSelectedProject(proj);
  };
}
