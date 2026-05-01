import api from "./api";

export interface ProjectDto {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  active: boolean;
}

export const projectService = {
  /** Get active projects — for dropdowns across all pages. */
  getActiveProjects: () =>
    api.get<ProjectDto[]>("/projects/active").then((r) => r.data),

  /** Get all projects including inactive — admin only. */
  getAllProjects: () =>
    api.get<ProjectDto[]>("/projects").then((r) => r.data),

  create: (req: CreateProjectRequest) =>
    api.post<ProjectDto>("/projects", req).then((r) => r.data),

  update: (id: number, req: CreateProjectRequest) =>
    api.put<ProjectDto>(`/projects/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/projects/${id}`).then((r) => r.data),
};
