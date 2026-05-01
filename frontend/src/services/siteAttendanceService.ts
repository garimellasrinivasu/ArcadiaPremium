import api from "./api";

export interface ApprovalStepDto {
  id: number;
  stepOrder: number;
  approverRoleName: string;
  status: string;
  assignedToId: number | null;
  assignedToName: string | null;
  actedById: number | null;
  actedByName: string | null;
  remarks: string | null;
  actionAt: string | null;
}

export interface SiteAttendanceDto {
  id: number;
  attendanceDate: string;
  siteName: string;
  imageBase64: string;
  totalWorkers: number;
  maleCount: number;
  femaleCount: number;
  maleMastriCount: number;
  femaleMastriCount: number;
  maleHelperCount: number;
  femaleHelperCount: number;
  remarks: string;
  status: string;
  submittedById: number;
  submittedByName: string;
  approverId: number;
  approverName: string;
  approverRemarks: string;
  approvedAt: string;
  approvalChainId: number | null;
  approvalChainName: string | null;
  currentStepOrder: number;
  totalSteps: number;
  currentStepRoleName: string | null;
  approvalSteps: ApprovalStepDto[];
  createdAt: string;
}

export interface CreateSiteAttendanceRequest {
  attendanceDate: string;
  siteName: string;
  imageBase64: string;
  totalWorkers: number;
  maleCount: number;
  femaleCount: number;
  maleMastriCount: number;
  femaleMastriCount: number;
  maleHelperCount: number;
  femaleHelperCount: number;
  remarks: string;
  approverId?: number;
}

export interface ApproveAttendanceRequest {
  action: "APPROVED" | "REJECTED";
  remarks: string;
}

export const siteAttendanceService = {
  create: (req: CreateSiteAttendanceRequest) =>
    api.post<SiteAttendanceDto>("/site-attendance", req).then((r) => r.data),

  approve: (id: number, req: ApproveAttendanceRequest) =>
    api.put<SiteAttendanceDto>(`/site-attendance/${id}/approve`, req).then((r) => r.data),

  getMySubmissions: () =>
    api.get<SiteAttendanceDto[]>("/site-attendance/my-submissions").then((r) => r.data),

  getPendingApprovals: () =>
    api.get<SiteAttendanceDto[]>("/site-attendance/pending-approvals").then((r) => r.data),

  getPendingCount: () =>
    api.get<{ count: number }>("/site-attendance/pending-count").then((r) => r.data.count),

  getAll: () =>
    api.get<SiteAttendanceDto[]>("/site-attendance").then((r) => r.data),

  deleteRecord: (id: number) =>
    api.delete(`/site-attendance/${id}`).then((r) => r.data),
};
