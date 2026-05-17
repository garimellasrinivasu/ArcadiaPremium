import api from "./api";

export interface WalkInDto {
  id: number;
  visitDate: string;
  visitorName: string;
  phone: string;
  email?: string;
  source: string;
  sourceDetails?: string;
  projectName: string;
  plotSizeInterested?: string;
  budgetRange?: string;
  facingPreference?: string;
  customerProfile?: string;
  paymentMode?: string;
  prospect: boolean;
  status: string;
  nextFollowUpDate?: string;
  remarks?: string;
  followUp1?: string;
  followUp2?: string;
  followUp3?: string;
  handledBy: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalkInRequest {
  visitDate: string;
  visitorName: string;
  phone: string;
  email?: string;
  source: string;
  sourceDetails?: string;
  projectName: string;
  plotSizeInterested?: string;
  budgetRange?: string;
  facingPreference?: string;
  customerProfile?: string;
  paymentMode?: string;
  prospect: boolean;
  status?: string;
  nextFollowUpDate?: string;
  remarks?: string;
  followUp1?: string;
  followUp2?: string;
  followUp3?: string;
  handledBy: string;
}

export interface DashboardStats {
  totalWalkIns: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  byHandler: Record<string, number>;
  byDate: { date: string; count: number }[];
  hotLeads: number;
  pendingFollowUps: number;
}

export const walkInService = {
  create: (req: CreateWalkInRequest) =>
    api.post<WalkInDto>("/walk-ins", req).then((r) => r.data),

  update: (id: number, req: CreateWalkInRequest) =>
    api.put<WalkInDto>(`/walk-ins/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/walk-ins/${id}`),

  getAll: () =>
    api.get<WalkInDto[]>("/walk-ins").then((r) => r.data),

  getByProject: (projectName: string) =>
    api.get<WalkInDto[]>(`/walk-ins/project/${encodeURIComponent(projectName)}`).then((r) => r.data),

  getByStatus: (status: string) =>
    api.get<WalkInDto[]>(`/walk-ins/status/${status}`).then((r) => r.data),

  getByDateRange: (from: string, to: string) =>
    api.get<WalkInDto[]>("/walk-ins/date-range", { params: { from, to } }).then((r) => r.data),

  getPendingFollowUps: () =>
    api.get<WalkInDto[]>("/walk-ins/pending-followups").then((r) => r.data),

  getDashboard: (from: string, to: string, project?: string) =>
    api.get<DashboardStats>("/walk-ins/dashboard", {
      params: { from, to, ...(project ? { project } : {}) },
    }).then((r) => r.data),
};
