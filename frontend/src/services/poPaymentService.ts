import api from "./api";

export interface POPaymentCertificateDto {
  id: number;
  certificateNo: string;
  vendorId: number;
  vendorName?: string;
  purchaseOrderId?: number;
  poNumber?: string;
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

export interface CreatePOPaymentCertificateRequest {
  vendorId: number;
  purchaseOrderId?: number;
  paymentDate: string;
  paymentMode: "CASH" | "CHEQUE" | "WIRE_TRANSFER";
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  totalAmount: number;
  remarks?: string;
}

export const poPaymentService = {
  async getAll(): Promise<POPaymentCertificateDto[]> {
    const res = await api.get("/po-payment-certificates");
    return res.data;
  },
  async getById(id: number): Promise<POPaymentCertificateDto> {
    const res = await api.get(`/po-payment-certificates/${id}`);
    return res.data;
  },
  async getByVendor(vendorId: number): Promise<POPaymentCertificateDto[]> {
    const res = await api.get(`/po-payment-certificates/by-vendor/${vendorId}`);
    return res.data;
  },
  async create(req: CreatePOPaymentCertificateRequest): Promise<POPaymentCertificateDto> {
    const res = await api.post("/po-payment-certificates", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<POPaymentCertificateDto> {
    const res = await api.put(`/po-payment-certificates/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/po-payment-certificates/${id}`);
  },
};
