import api from "./api";

export interface ApprovalChainStepDto {
  id?: number;
  stepOrder: number;
  approverRoleName: string;
  approverUserId: number | null;
  approverUserName: string | null;
  blocking: boolean;
}

export interface ApprovalChainDto {
  id: number;
  name: string;
  submitterRoleName: string;
  active: boolean;
  steps: ApprovalChainStepDto[];
  createdAt: string;
}

export interface CreateApprovalChainRequest {
  name: string;
  submitterRoleName: string;
  active: boolean;
  steps: { approverRoleName: string; approverUserId: number; blocking: boolean }[];
}

export const approvalChainService = {
  getAll: () =>
    api.get<ApprovalChainDto[]>("/approval-chains").then((r) => r.data),

  getById: (id: number) =>
    api.get<ApprovalChainDto>(`/approval-chains/${id}`).then((r) => r.data),

  create: (req: CreateApprovalChainRequest) =>
    api.post<ApprovalChainDto>("/approval-chains", req).then((r) => r.data),

  update: (id: number, req: CreateApprovalChainRequest) =>
    api.put<ApprovalChainDto>(`/approval-chains/${id}`, req).then((r) => r.data),

  delete: (id: number) => api.delete(`/approval-chains/${id}`),
};
