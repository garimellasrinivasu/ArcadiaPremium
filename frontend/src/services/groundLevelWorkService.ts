import api from "./api";

export interface GroundLevelWorkDto {
  id: number;
  vehicleType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  breakdownDays: number;
  totalWorkingDays: number;
  rentPerDay: number;
  rentAmount: number;
  driverBatthaPerDay: number;
  batthaPaid: number;
  otherAdvance: number;
  totalNetPayable: number;
  billMonth: string;
  projectName: string;
  remarks: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroundLevelWorkRequest {
  vehicleType: string;
  startDate: string;
  endDate: string;
  numberOfDays?: number;
  breakdownDays?: number;
  totalWorkingDays?: number;
  rentPerDay?: number;
  rentAmount?: number;
  driverBatthaPerDay?: number;
  batthaPaid?: number;
  otherAdvance?: number;
  totalNetPayable?: number;
  billMonth?: string;
  projectName?: string;
  remarks?: string;
}

export const groundLevelWorkService = {
  create: (req: CreateGroundLevelWorkRequest) =>
    api.post<GroundLevelWorkDto>("/ground-level-work", req).then((r) => r.data),

  getAll: () =>
    api.get<GroundLevelWorkDto[]>("/ground-level-work").then((r) => r.data),

  getByProject: (projectName: string) =>
    api
      .get<GroundLevelWorkDto[]>("/ground-level-work/by-project", {
        params: { projectName },
      })
      .then((r) => r.data),

  getByProjectAndMonth: (projectName: string, billMonth: string) =>
    api
      .get<GroundLevelWorkDto[]>("/ground-level-work/by-project-month", {
        params: { projectName, billMonth },
      })
      .then((r) => r.data),

  update: (id: number, req: CreateGroundLevelWorkRequest) =>
    api
      .put<GroundLevelWorkDto>(`/ground-level-work/${id}`, req)
      .then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/ground-level-work/${id}`).then((r) => r.data),
};
