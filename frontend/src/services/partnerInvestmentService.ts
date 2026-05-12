import api from "./api";

export interface PartnerInvestmentDto {
  id: number;
  projectName: string;
  partnerName: string;
  investmentDate: string;
  amount: number;
  paymentMode: string;
  referenceNo?: string;
  bankName?: string;
  accountDetails?: string;
  transactionId?: string;
  description?: string;
  purpose?: string;
  receiptImageBase64?: string;
  hasReceipt?: boolean;
  status: string;
  partner1Approved?: boolean;
  partner1ApprovedAt?: string;
  partner1Signature?: string;
  partner2Approved?: boolean;
  partner2ApprovedAt?: string;
  partner2Signature?: string;
  partner3Approved?: boolean;
  partner3ApprovedAt?: string;
  partner3Signature?: string;
  createdById: number;
  createdByName: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerInvestmentRequest {
  projectName: string;
  partnerName: string;
  investmentDate: string;
  amount: number;
  paymentMode: string;
  referenceNo?: string;
  bankName?: string;
  accountDetails?: string;
  transactionId?: string;
  description?: string;
  purpose?: string;
  receiptImageBase64?: string;
  remarks?: string;
}

export const partnerInvestmentService = {
  create: (req: CreatePartnerInvestmentRequest) =>
    api.post<PartnerInvestmentDto>("/partner-investments", req).then((r) => r.data),

  getAll: () =>
    api.get<PartnerInvestmentDto[]>("/partner-investments").then((r) => r.data),

  getById: (id: number) =>
    api.get<PartnerInvestmentDto>(`/partner-investments/${id}`).then((r) => r.data),

  mySubmissions: () =>
    api.get<PartnerInvestmentDto[]>("/partner-investments/my-submissions").then((r) => r.data),

  pending: () =>
    api.get<PartnerInvestmentDto[]>("/partner-investments/pending").then((r) => r.data),

  approved: () =>
    api.get<PartnerInvestmentDto[]>("/partner-investments/approved").then((r) => r.data),

  byProject: (project: string) =>
    api.get<PartnerInvestmentDto[]>("/partner-investments/by-project", { params: { project } }).then((r) => r.data),

  approve: (id: number, signature: string) =>
    api.put<PartnerInvestmentDto>(`/partner-investments/${id}/approve`, { signature }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/partner-investments/${id}`),

  partnerNames: () =>
    api.get<string[]>("/partner-investments/partner-names").then((r) => r.data),

  partnerNamesByProject: (project: string) =>
    api.get<string[]>("/partner-investments/partner-names-by-project", { params: { project } }).then((r) => r.data),
};
