import api from "./api";

export interface RequisitionItemDto {
  id: number;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  requiredQuantity: number;
  approvedQuantity?: number;
  issuedQuantity?: number;
  remarks?: string;
}

export interface MaterialRequisitionDto {
  id: number;
  requisitionNo: string;
  projectId: number;
  projectName?: string;
  unitName?: string;
  requisitionDate: string;
  requiredDate?: string;
  status: string;
  indentStatus?: string;
  issueStatus?: string;
  remarks?: string;
  items: RequisitionItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRequisitionItemRequest {
  materialId: number;
  requiredQuantity: number;
  remarks?: string;
}

export interface CreateRequisitionRequest {
  projectId: number;
  unitName?: string;
  requisitionDate: string;
  requiredDate?: string;
  remarks?: string;
  items: CreateRequisitionItemRequest[];
}

export const requisitionService = {
  async getAll(): Promise<MaterialRequisitionDto[]> {
    const res = await api.get("/material-requisitions");
    return res.data;
  },
  async getById(id: number): Promise<MaterialRequisitionDto> {
    const res = await api.get(`/material-requisitions/${id}`);
    return res.data;
  },
  async getByProject(projectId: number): Promise<MaterialRequisitionDto[]> {
    const res = await api.get(`/material-requisitions/by-project/${projectId}`);
    return res.data;
  },
  async getByStatus(status: string): Promise<MaterialRequisitionDto[]> {
    const res = await api.get(`/material-requisitions/by-status/${status}`);
    return res.data;
  },
  async create(req: CreateRequisitionRequest): Promise<MaterialRequisitionDto> {
    const res = await api.post("/material-requisitions", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<MaterialRequisitionDto> {
    const res = await api.put(`/material-requisitions/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/material-requisitions/${id}`);
  },
};
