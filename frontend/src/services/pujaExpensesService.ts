import api from "./api";

export interface PujaExpenseDto {
  id: number;
  pujaName: string;
  pujaDate: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  paymentStatus: string;
  paidBy: string;
  paymentMode: string;
  receiptNo: string;
  payeeName: string;
  projectName: string;
  notes: string;
  preparedBy: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePujaExpenseRequest {
  pujaName: string;
  pujaDate: string;
  category: string;
  description?: string;
  vendor?: string;
  amount: number;
  paymentStatus?: string;
  paidBy?: string;
  paymentMode?: string;
  receiptNo?: string;
  payeeName?: string;
  projectName?: string;
  notes?: string;
  preparedBy?: string;
}

export const pujaExpensesService = {
  create: (req: CreatePujaExpenseRequest) =>
    api.post<PujaExpenseDto>("/puja-expenses", req).then((r) => r.data),

  getAll: () =>
    api.get<PujaExpenseDto[]>("/puja-expenses").then((r) => r.data),

  getByPujaName: (pujaName: string) =>
    api.get<PujaExpenseDto[]>("/puja-expenses/by-puja", { params: { pujaName } }).then((r) => r.data),

  getByProject: (projectName: string) =>
    api.get<PujaExpenseDto[]>("/puja-expenses/by-project", { params: { projectName } }).then((r) => r.data),

  update: (id: number, req: CreatePujaExpenseRequest) =>
    api.put<PujaExpenseDto>(`/puja-expenses/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/puja-expenses/${id}`).then((r) => r.data),
};
