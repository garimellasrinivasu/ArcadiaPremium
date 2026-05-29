import api from "./api";

export interface GRNItemDto {
  id: number;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  acceptedQuantity: number;
  remarks?: string;
}

export interface GRNDto {
  id: number;
  grnNo: string;
  mrnId?: number;
  mrnNo?: string;
  grnDate: string;
  inspectedBy?: string;
  status?: string;
  remarks?: string;
  items: GRNItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGRNItemRequest {
  materialId: number;
  acceptedQuantity: number;
  remarks?: string;
}

export interface CreateGRNRequest {
  mrnId: number;
  grnDate: string;
  inspectedBy?: string;
  remarks?: string;
  items: CreateGRNItemRequest[];
}

export const grnService = {
  async getAll(): Promise<GRNDto[]> {
    const res = await api.get("/grns");
    return res.data;
  },
  async getById(id: number): Promise<GRNDto> {
    const res = await api.get(`/grns/${id}`);
    return res.data;
  },
  async getByMrn(mrnId: number): Promise<GRNDto[]> {
    const res = await api.get(`/grns/by-mrn/${mrnId}`);
    return res.data;
  },
  async create(req: CreateGRNRequest): Promise<GRNDto> {
    const res = await api.post("/grns", req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/grns/${id}`);
  },
};
