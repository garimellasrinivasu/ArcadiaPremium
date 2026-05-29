import api from "./api";

export interface WarehouseDto {
  id: number;
  name: string;
  projectId: number;
  projectName?: string;
  location?: string;
  description?: string;
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWarehouseRequest {
  name: string;
  projectId: number;
  location?: string;
  description?: string;
}

export const warehouseService = {
  async getAll(): Promise<WarehouseDto[]> {
    const res = await api.get("/warehouses");
    return res.data;
  },
  async getByProject(projectId: number): Promise<WarehouseDto[]> {
    const res = await api.get("/warehouses/by-project", { params: { projectId } });
    return res.data;
  },
  async getById(id: number): Promise<WarehouseDto> {
    const res = await api.get(`/warehouses/${id}`);
    return res.data;
  },
  async create(req: CreateWarehouseRequest): Promise<WarehouseDto> {
    const res = await api.post("/warehouses", req);
    return res.data;
  },
  async update(id: number, req: CreateWarehouseRequest): Promise<WarehouseDto> {
    const res = await api.put(`/warehouses/${id}`, req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/warehouses/${id}`);
  },
};
