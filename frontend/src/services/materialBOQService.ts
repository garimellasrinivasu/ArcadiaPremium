import api from "./api";

export interface MaterialBOQDto {
  id: number;
  projectId: number;
  projectName?: string;
  unitName?: string;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  boqQuantity: number;
  wastagePercent?: number;
  effectiveQuantity?: number;
  status?: string;
  approvedBy?: string;
  remarks?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaterialBOQRequest {
  projectId: number;
  unitName?: string;
  materialId: number;
  boqQuantity: number;
  wastagePercent?: number;
  remarks?: string;
}

export const materialBOQService = {
  async getAll(): Promise<MaterialBOQDto[]> {
    const res = await api.get("/material-boqs");
    return res.data;
  },
  async getByProject(projectId: number): Promise<MaterialBOQDto[]> {
    const res = await api.get(`/material-boqs/by-project/${projectId}`);
    return res.data;
  },
  async getById(id: number): Promise<MaterialBOQDto> {
    const res = await api.get(`/material-boqs/${id}`);
    return res.data;
  },
  async create(req: CreateMaterialBOQRequest): Promise<MaterialBOQDto> {
    const res = await api.post("/material-boqs", req);
    return res.data;
  },
  async update(id: number, req: CreateMaterialBOQRequest): Promise<MaterialBOQDto> {
    const res = await api.put(`/material-boqs/${id}`, req);
    return res.data;
  },
  async approve(id: number): Promise<MaterialBOQDto> {
    const res = await api.put(`/material-boqs/${id}/approve`);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/material-boqs/${id}`);
  },
};
