import api from "./api";

export interface RABillAdjustmentDto {
  id: number;
  adjustmentType: "ADDITION" | "DEDUCTION";
  nature: "REFUNDABLE" | "NON_REFUNDABLE";
  description?: string;
  amount: number;
  released: boolean;
}

export interface RABillItemDto {
  id: number;
  activityId: number;
  activityName?: string;
  activityUom?: string;
  measurementBookId?: number;
  woQty?: number;
  woRate?: number;
  previousQty?: number;
  currentQty: number;
  cumulativeQty?: number;
  previousAmount?: number;
  currentAmount?: number;
  cumulativeAmount?: number;
  paymentReleasePercent?: number;
}

export interface RABillDto {
  id: number;
  billNo: string;
  workOrderId: number;
  woNumber?: string;
  contractorId: number;
  contractorName?: string;
  projectId: number;
  projectName?: string;
  billDate: string;
  billType: "ADVANCE" | "WORK_DONE" | "RECOVERY_RELEASE" | "FINAL";
  advanceCategory?: string;
  advancePercent?: number;
  advanceAmount?: number;
  currentBillAmount?: number;
  previousBillAmount?: number;
  cumulativeBillAmount?: number;
  retentionPercent?: number;
  retentionAmount?: number;
  advanceRecoveryAmount?: number;
  deductionAmount?: number;
  retentionReleaseAmount?: number;
  deductionReleaseAmount?: number;
  taxAmount?: number;
  netPayable?: number;
  status: string;
  posted: boolean;
  remarks?: string;
  items: RABillItemDto[];
  adjustments?: RABillAdjustmentDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRABillItemRequest {
  activityId: number;
  measurementBookId?: number;
  currentQty: number;
  woRate: number;
}

export interface CreateRABillAdjustmentRequest {
  adjustmentType: "ADDITION" | "DEDUCTION";
  nature: "REFUNDABLE" | "NON_REFUNDABLE";
  description?: string;
  amount: number;
}

export interface CreateRABillRequest {
  workOrderId: number;
  contractorId: number;
  projectId: number;
  billDate: string;
  billType: "ADVANCE" | "WORK_DONE" | "RECOVERY_RELEASE" | "FINAL";
  advanceCategory?: string;
  advancePercent?: number;
  retentionPercent?: number;
  remarks?: string;
  items: CreateRABillItemRequest[];
  adjustments?: CreateRABillAdjustmentRequest[];
}

export const raBillService = {
  async getAll(): Promise<RABillDto[]> {
    const res = await api.get("/ra-bills");
    return res.data;
  },
  async getById(id: number): Promise<RABillDto> {
    const res = await api.get(`/ra-bills/${id}`);
    return res.data;
  },
  async getByWorkOrder(workOrderId: number): Promise<RABillDto[]> {
    const res = await api.get(`/ra-bills/by-work-order/${workOrderId}`);
    return res.data;
  },
  async getByContractor(contractorId: number): Promise<RABillDto[]> {
    const res = await api.get(`/ra-bills/by-contractor/${contractorId}`);
    return res.data;
  },
  async getByBillType(billType: string): Promise<RABillDto[]> {
    const res = await api.get(`/ra-bills/by-bill-type/${billType}`);
    return res.data;
  },
  async create(req: CreateRABillRequest): Promise<RABillDto> {
    const res = await api.post("/ra-bills", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<RABillDto> {
    const res = await api.put(`/ra-bills/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/ra-bills/${id}`);
  },
};
