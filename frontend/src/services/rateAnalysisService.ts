import api from "./api";

// ── Rate Analysis Item ─────────────────────────────────────────────────

export interface RateAnalysisItemDto {
  id: number;
  category: "MATERIAL" | "LABOR" | "MACHINERY" | "OTHER";
  description: string;
  materialName: string;
  coefficient: number;
  rate: number;
  amount: number;
}

// ── Rate Analysis ──────────────────────────────────────────────────────

export interface RateAnalysisDto {
  id: number;
  projectId: number;
  projectName: string;
  activityId: number;
  activityName: string;
  unitRate: number;
  status: string;
  items: RateAnalysisItemDto[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateAnalysisRequest {
  projectId: number;
  activityId: number;
  items: {
    category: string;
    description?: string;
    materialName?: string;
    coefficient: number;
    rate: number;
  }[];
}

// ── Service ────────────────────────────────────────────────────────────

export const rateAnalysisService = {
  async create(req: CreateRateAnalysisRequest): Promise<RateAnalysisDto> {
    const res = await api.post("/rate-analyses", req);
    return res.data;
  },
  async getAll(): Promise<RateAnalysisDto[]> {
    const res = await api.get("/rate-analyses");
    return res.data;
  },
  async getById(id: number): Promise<RateAnalysisDto> {
    const res = await api.get(`/rate-analyses/${id}`);
    return res.data;
  },
  async getByProject(projectId: number): Promise<RateAnalysisDto[]> {
    const res = await api.get(`/rate-analyses/by-project/${projectId}`);
    return res.data;
  },
  async getByActivity(activityId: number): Promise<RateAnalysisDto[]> {
    const res = await api.get(`/rate-analyses/by-activity/${activityId}`);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<RateAnalysisDto> {
    const res = await api.put(`/rate-analyses/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/rate-analyses/${id}`);
  },
};
