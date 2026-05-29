import api from "./api";

export interface IndentItemDto {
  id: number;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  indentQuantity: number;
  approvedQuantity?: number;
  poQuantity?: number;
  remarks?: string;
}

export interface MaterialIndentDto {
  id: number;
  indentNo: string;
  projectId: number;
  projectName?: string;
  indentDate: string;
  indentType: "DIRECT" | "FROM_REQUISITION";
  requisitionId?: number;
  requisitionNo?: string;
  status: string;
  remarks?: string;
  items: IndentItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateIndentItemRequest {
  materialId: number;
  indentQuantity: number;
  remarks?: string;
}

export interface CreateIndentRequest {
  projectId: number;
  indentDate: string;
  indentType: "DIRECT" | "FROM_REQUISITION";
  requisitionId?: number;
  remarks?: string;
  items: CreateIndentItemRequest[];
}

export const indentService = {
  async getAll(): Promise<MaterialIndentDto[]> {
    const res = await api.get("/material-indents");
    return res.data;
  },
  async getById(id: number): Promise<MaterialIndentDto> {
    const res = await api.get(`/material-indents/${id}`);
    return res.data;
  },
  async getByProject(projectId: number): Promise<MaterialIndentDto[]> {
    const res = await api.get(`/material-indents/by-project/${projectId}`);
    return res.data;
  },
  async create(req: CreateIndentRequest): Promise<MaterialIndentDto> {
    const res = await api.post("/material-indents", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<MaterialIndentDto> {
    const res = await api.put(`/material-indents/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/material-indents/${id}`);
  },
};
