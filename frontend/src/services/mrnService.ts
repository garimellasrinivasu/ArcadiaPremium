import api from "./api";

export interface MRNItemDto {
  id: number;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  receivedQuantity: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  remarks?: string;
}

export interface MRNDto {
  id: number;
  mrnNo: string;
  purchaseOrderId?: number;
  poNumber?: string;
  sourceType?: string;
  mrnDate: string;
  vehicleNo?: string;
  status: string;
  remarks?: string;
  items: MRNItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMRNItemRequest {
  materialId: number;
  receivedQuantity: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  remarks?: string;
}

export interface CreateMRNRequest {
  purchaseOrderId?: number;
  sourceType?: string;
  mrnDate: string;
  vehicleNo?: string;
  remarks?: string;
  items: CreateMRNItemRequest[];
}

export const mrnService = {
  async getAll(): Promise<MRNDto[]> {
    const res = await api.get("/mrns");
    return res.data;
  },
  async getById(id: number): Promise<MRNDto> {
    const res = await api.get(`/mrns/${id}`);
    return res.data;
  },
  async getByPurchaseOrder(poId: number): Promise<MRNDto[]> {
    const res = await api.get(`/mrns/by-purchase-order/${poId}`);
    return res.data;
  },
  async create(req: CreateMRNRequest): Promise<MRNDto> {
    const res = await api.post("/mrns", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<MRNDto> {
    const res = await api.put(`/mrns/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/mrns/${id}`);
  },
};
