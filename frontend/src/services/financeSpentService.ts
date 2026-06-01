import api from "./api";

export interface FinanceSpentDto {
  id: number;
  requestNumber?: string;
  projectName: string;
  spentDate: string;
  amount: number;
  paidBy: string;
  paidTo: string;
  vendorAcknowledgement?: string;
  receiptImageBase64?: string;
  hasReceipt?: boolean;
  description?: string;
  remarks?: string;
  status: string;
  paymentDate?: string;
  paymentRemarks?: string;
  submittedById: number;
  submittedByName: string;
  approvedById?: number;
  approvedByName?: string;
  approverRemarks?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinanceSpentRequest {
  projectName: string;
  spentDate: string;
  amount: number;
  paidBy: string;
  paidTo: string;
  vendorAcknowledgement?: string;
  receiptImageBase64?: string;
  description?: string;
  remarks?: string;
}

export interface MarkPaidRequest {
  receiptImageBase64?: string;
  paymentDate?: string;
  paymentRemarks?: string;
  vendorAcknowledgement?: string;
}

export interface UserName {
  id: number;
  name: string;
}

export const financeSpentService = {
  /** Stage 1: Create a payment request (no receipt needed) */
  create: (req: CreateFinanceSpentRequest) =>
    api.post<FinanceSpentDto>("/finance-spent", req).then((r) => r.data),

  getAll: () =>
    api.get<FinanceSpentDto[]>("/finance-spent").then((r) => r.data),

  getById: (id: number) =>
    api.get<FinanceSpentDto>(`/finance-spent/${id}`).then((r) => r.data),

  /** Lightweight — fetches only the receipt image, not the full entity */
  getReceipt: (id: number) =>
    api.get<{ receiptImageBase64: string }>(`/finance-spent/${id}/receipt`).then((r) => r.data.receiptImageBase64),

  mySubmissions: () =>
    api.get<FinanceSpentDto[]>("/finance-spent/my-submissions").then((r) => r.data),

  /** Stage 2: Get pending approval requests (for authority users) */
  pendingApprovals: () =>
    api.get<FinanceSpentDto[]>("/finance-spent/pending").then((r) => r.data),

  /** Stage 2: Approve or reject a request */
  approve: (id: number, action: string, remarks?: string) =>
    api.put<FinanceSpentDto>(`/finance-spent/${id}/approve`, { action, remarks }).then((r) => r.data),

  /** Stage 3: Get approved requests ready for the current user to pay */
  approvedForPayment: () =>
    api.get<FinanceSpentDto[]>("/finance-spent/approved-for-payment").then((r) => r.data),

  /** Stage 3: Mark an approved request as paid with receipt */
  markPaid: (id: number, req: MarkPaidRequest) =>
    api.put<FinanceSpentDto>(`/finance-spent/${id}/mark-paid`, req).then((r) => r.data),

  reports: (from: string, to: string, project?: string) =>
    api.get<FinanceSpentDto[]>("/finance-spent/reports", {
      params: { from, to, ...(project ? { project } : {}) },
    }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/finance-spent/${id}`),

  /** Get active user names for "Who Paid" dropdown */
  getUserNames: () =>
    api.get<UserName[]>("/finance-spent/user-names").then((r) => r.data),

  /** Get distinct paidBy values for suggestions */
  getDistinctPaidBy: () =>
    api.get<string[]>("/finance-spent/distinct/paid-by").then((r) => r.data),

  /** Get distinct paidTo values for suggestions */
  getDistinctPaidTo: () =>
    api.get<string[]>("/finance-spent/distinct/paid-to").then((r) => r.data),

  /** Get distinct descriptions for suggestions */
  getDistinctDescriptions: () =>
    api.get<string[]>("/finance-spent/distinct/descriptions").then((r) => r.data),
};
