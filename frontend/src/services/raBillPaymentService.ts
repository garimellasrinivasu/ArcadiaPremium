import api from "./api";

export interface RABillPaymentCertificateDto {
  id: number;
  certificateNo: string;
  contractorId: number;
  contractorName?: string;
  workOrderId: number;
  woNumber?: string;
  paymentDate: string;
  paymentMode: "CASH" | "CHEQUE" | "WIRE_TRANSFER";
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  totalAmount: number;
  remarks?: string;
  status: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRABillPaymentCertificateRequest {
  contractorId: number;
  workOrderId: number;
  paymentDate: string;
  paymentMode: "CASH" | "CHEQUE" | "WIRE_TRANSFER";
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  totalAmount: number;
  remarks?: string;
}

export const raBillPaymentService = {
  async getAll(): Promise<RABillPaymentCertificateDto[]> {
    const res = await api.get("/ra-bill-payments");
    return res.data;
  },
  async getById(id: number): Promise<RABillPaymentCertificateDto> {
    const res = await api.get(`/ra-bill-payments/${id}`);
    return res.data;
  },
  async getByContractor(contractorId: number): Promise<RABillPaymentCertificateDto[]> {
    const res = await api.get(`/ra-bill-payments/by-contractor/${contractorId}`);
    return res.data;
  },
  async create(req: CreateRABillPaymentCertificateRequest): Promise<RABillPaymentCertificateDto> {
    const res = await api.post("/ra-bill-payments", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<RABillPaymentCertificateDto> {
    const res = await api.put(`/ra-bill-payments/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/ra-bill-payments/${id}`);
  },
};
