/**
 * Utility to resolve project logos for printing, saving, and display.
 *
 * Pages that have their own project selector can pass the project name/key
 * to get the matching logo. Otherwise, use the global ProjectContext.
 */

import { PROJECTS, type ProjectInfo } from "../contexts/ProjectContext";

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
