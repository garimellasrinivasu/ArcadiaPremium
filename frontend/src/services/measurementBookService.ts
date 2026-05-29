import api from "./api";

export interface MBItemDetailDto {
  id?: number;
  operand?: string;
  description?: string;
  nos: number;
  length: number;
  breadth: number;
  height: number;
  quantity: number;
}

export interface MBItemDto {
  id: number;
  activityId: number;
  activityName?: string;
  activityUom?: string;
  previousMeasuredQty?: number;
  currentMeasuredQty: number;
  cumulativeMeasuredQty?: number;
  woQty?: number;
  details: MBItemDetailDto[];
}

export interface MeasurementBookDto {
  id: number;
  mbNumber: string;
  workOrderId: number;
  woNumber?: string;
  projectId: number;
  projectName?: string;
  mbDate: string;
  status: string;
  remarks?: string;
  items: MBItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMBItemDetailRequest {
  description?: string;
  operand?: string;
  nos: number;
  length: number;
  breadth: number;
  height: number;
}

export interface CreateMBItemRequest {
  activityId: number;
  currentMeasuredQty: number;
  details: CreateMBItemDetailRequest[];
}

export interface CreateMeasurementBookRequest {
  workOrderId: number;
  projectId: number;
  mbDate: string;
  remarks?: string;
  items: CreateMBItemRequest[];
}

export const measurementBookService = {
  async getAll(): Promise<MeasurementBookDto[]> {
    const res = await api.get("/measurement-books");
    return res.data;
  },
  async getById(id: number): Promise<MeasurementBookDto> {
    const res = await api.get(`/measurement-books/${id}`);
    return res.data;
  },
  async getByWorkOrder(workOrderId: number): Promise<MeasurementBookDto[]> {
    const res = await api.get(`/measurement-books/by-work-order/${workOrderId}`);
    return res.data;
  },
  async create(req: CreateMeasurementBookRequest): Promise<MeasurementBookDto> {
    const res = await api.post("/measurement-books", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<MeasurementBookDto> {
    const res = await api.put(`/measurement-books/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/measurement-books/${id}`);
  },
};
