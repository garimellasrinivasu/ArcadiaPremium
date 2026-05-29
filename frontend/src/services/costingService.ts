import api from "./api";

// ─── Costing Standard Head ───
export interface CostingStandardHeadDto {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const costingStandardHeadService = {
  getAll: async (): Promise<CostingStandardHeadDto[]> => {
    const res = await api.get("/costing-standard-heads");
    return res.data;
  },
  getActive: async (): Promise<CostingStandardHeadDto[]> => {
    const res = await api.get("/costing-standard-heads/active");
    return res.data;
  },
  getByCategory: async (category: string): Promise<CostingStandardHeadDto[]> => {
    const res = await api.get(`/costing-standard-heads/by-category/${category}`);
    return res.data;
  },
  getById: async (id: number): Promise<CostingStandardHeadDto> => {
    const res = await api.get(`/costing-standard-heads/${id}`);
    return res.data;
  },
  create: async (data: Record<string, any>): Promise<CostingStandardHeadDto> => {
    const res = await api.post("/costing-standard-heads", data);
    return res.data;
  },
  update: async (id: number, data: Record<string, any>): Promise<CostingStandardHeadDto> => {
    const res = await api.put(`/costing-standard-heads/${id}`, data);
    return res.data;
  },
  toggleActive: async (id: number): Promise<CostingStandardHeadDto> => {
    const res = await api.put(`/costing-standard-heads/${id}/toggle-active`);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/costing-standard-heads/${id}`);
  },
};

// ─── Costing Custom Head ───
export interface CostingCustomHeadDto {
  id: number;
  code: string;
  name: string;
  description: string;
  standardHeadId: number;
  standardHeadName: string;
  projectId: number;
  projectName: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const costingCustomHeadService = {
  getAll: async (): Promise<CostingCustomHeadDto[]> => {
    const res = await api.get("/costing-custom-heads");
    return res.data;
  },
  getByProject: async (projectId: number): Promise<CostingCustomHeadDto[]> => {
    const res = await api.get(`/costing-custom-heads/by-project/${projectId}`);
    return res.data;
  },
  getById: async (id: number): Promise<CostingCustomHeadDto> => {
    const res = await api.get(`/costing-custom-heads/${id}`);
    return res.data;
  },
  create: async (data: Record<string, any>): Promise<CostingCustomHeadDto> => {
    const res = await api.post("/costing-custom-heads", data);
    return res.data;
  },
  update: async (id: number, data: Record<string, any>): Promise<CostingCustomHeadDto> => {
    const res = await api.put(`/costing-custom-heads/${id}`, data);
    return res.data;
  },
  toggleActive: async (id: number): Promise<CostingCustomHeadDto> => {
    const res = await api.put(`/costing-custom-heads/${id}/toggle-active`);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/costing-custom-heads/${id}`);
  },
};

// ─── Map Cost Head ───
export interface MapCostHeadDto {
  id: number;
  jobId: number;
  jobName: string;
  activityId: number;
  activityName: string;
  standardHeadId: number;
  standardHeadName: string;
  customHeadId: number | null;
  customHeadName: string | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const mapCostHeadService = {
  getAll: async (): Promise<MapCostHeadDto[]> => {
    const res = await api.get("/map-cost-heads");
    return res.data;
  },
  getByJob: async (jobId: number): Promise<MapCostHeadDto[]> => {
    const res = await api.get(`/map-cost-heads/by-job/${jobId}`);
    return res.data;
  },
  getById: async (id: number): Promise<MapCostHeadDto> => {
    const res = await api.get(`/map-cost-heads/${id}`);
    return res.data;
  },
  create: async (data: Record<string, any>): Promise<MapCostHeadDto> => {
    const res = await api.post("/map-cost-heads", data);
    return res.data;
  },
  update: async (id: number, data: Record<string, any>): Promise<MapCostHeadDto> => {
    const res = await api.put(`/map-cost-heads/${id}`, data);
    return res.data;
  },
  toggleActive: async (id: number): Promise<MapCostHeadDto> => {
    const res = await api.put(`/map-cost-heads/${id}/toggle-active`);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/map-cost-heads/${id}`);
  },
};
