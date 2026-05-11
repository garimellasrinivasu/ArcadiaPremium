import api from "./api";

export interface FinanceSpentDto {
  id: number;
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

export interface UserName {
  id: number;
  name: string;
}

export const financeSpentService = {
  create: (req: CreateFinanceSpentRequest) =>
    api.post<FinanceSpentDto>("/finance-spent", req).then((r) => r.data),

  getAll: () =>
    api.get<FinanceSpentDto[]>("/finance-spent").then((r) => r.data),

  getById: (id: number) =>
    api.get<FinanceSpentDto>(`/finance-spent/${id}`).then((r) => r.data),

  mySubmissions: () =>
    api.get<FinanceSpentDto[]>("/finance-spent/my-submissions").then((r) => r.data),

  pendingApprovals: () =>
    api.get<FinanceSpentDto[]>("/finance-spent/pending").then((r) => r.data),

  reports: (from: string, to: string, project?: string) =>
    api.get<FinanceSpentDto[]>("/finance-spent/reports", {
      params: { from, to, ...(project ? { project } : {}) },
    }).then((r) => r.data),

  approve: (id: number, action: string, remarks?: string) =>
    api.put<FinanceSpentDto>(`/finance-spent/${id}/approve`, { action, remarks }).then((r) => r.data),

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
