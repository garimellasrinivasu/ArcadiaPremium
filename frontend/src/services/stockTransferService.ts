import api from "./api";

export interface StockTransferItemDto {
  id: number;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  quantity: number;
  remarks?: string;
}

export interface StockTransferDto {
  id: number;
  transferNo: string;
  fromProjectId: number;
  fromProjectName?: string;
  toProjectId: number;
  toProjectName?: string;
  transferDate: string;
  transferType: "SITE_TO_SITE" | "SITE_TO_COMPANY";
  status: string;
  remarks?: string;
  items: StockTransferItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStockTransferItemRequest {
  materialId: number;
  quantity: number;
  remarks?: string;
}

export interface CreateStockTransferRequest {
  fromProjectId: number;
  toProjectId: number;
  transferDate: string;
  transferType: "SITE_TO_SITE" | "SITE_TO_COMPANY";
  remarks?: string;
  items: CreateStockTransferItemRequest[];
}

export const stockTransferService = {
  async getAll(): Promise<StockTransferDto[]> {
    const res = await api.get("/stock-transfers");
    return res.data;
  },
  async getById(id: number): Promise<StockTransferDto> {
    const res = await api.get(`/stock-transfers/${id}`);
    return res.data;
  },
  async getByFromProject(projectId: number): Promise<StockTransferDto[]> {
    const res = await api.get(`/stock-transfers/by-from-project/${projectId}`);
    return res.data;
  },
  async create(req: CreateStockTransferRequest): Promise<StockTransferDto> {
    const res = await api.post("/stock-transfers", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<StockTransferDto> {
    const res = await api.put(`/stock-transfers/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/stock-transfers/${id}`);
  },
};
