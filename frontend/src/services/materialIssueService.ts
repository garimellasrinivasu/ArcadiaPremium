import api from "./api";

export interface MaterialIssueItemDto {
  id: number;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  issuedQuantity: number;
  remarks?: string;
}

export interface MaterialIssueDto {
  id: number;
  issueNo: string;
  projectId: number;
  projectName?: string;
  issueDate: string;
  issuedTo?: string;
  issuedToType?: string;
  remarks?: string;
  items: MaterialIssueItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaterialIssueItemRequest {
  materialId: number;
  issuedQuantity: number;
  remarks?: string;
}

export interface CreateMaterialIssueRequest {
  projectId: number;
  issueDate: string;
  issuedTo?: string;
  issuedToType?: string;
  remarks?: string;
  items: CreateMaterialIssueItemRequest[];
}

export const materialIssueService = {
  async getAll(): Promise<MaterialIssueDto[]> {
    const res = await api.get("/material-issues");
    return res.data;
  },
  async getById(id: number): Promise<MaterialIssueDto> {
    const res = await api.get(`/material-issues/${id}`);
    return res.data;
  },
  async getByProject(projectId: number): Promise<MaterialIssueDto[]> {
    const res = await api.get(`/material-issues/by-project/${projectId}`);
    return res.data;
  },
  async create(req: CreateMaterialIssueRequest): Promise<MaterialIssueDto> {
    const res = await api.post("/material-issues", req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/material-issues/${id}`);
  },
};
