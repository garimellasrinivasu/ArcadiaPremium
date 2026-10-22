import api from "./api";

export interface VillaConstructionStatusDto {
  id?: number;
  projectName: string;
  villaNumber: number;
  phase: string;
  activity1Done: boolean;
  activity2Done: boolean;
  incharge?: string;
  plannedTargetDate?: string;
  /** Planned date was filled with the import day because the schedule had none */
  plannedDateDefaulted?: boolean;
  /** Ticked done by a schedule import — no real completion day */
  completionImported?: boolean;
  revisedPlannedDate?: string;
  delayInDays?: number;
  actualCompletionDate?: string;
  updatedAt?: string;
  completedAt?: string;
  updatedBy?: string;
}

export interface VillaInchargeLogDto {
  id: number;
  projectName: string;
  villaNumber: number;
  phase: string;
  oldIncharge: string;
  newIncharge: string;
  changedBy: string;
  changedAt: string;
}

export interface ScheduleImportResult {
  dryRun: boolean;
  markedDone: number;
  datesSet: number;
  defaulted: number;
  unchanged: number;
  warnings: string[];
}

export interface PlanRow {
  villa: number; cluster: string; phase: string; stage: string; incharge: string;
  plannedDate?: string; revisedDate?: string; completedDate?: string; done: boolean;
  status?: "ON_TIME" | "LATE" | "COMPLETED" | "PENDING" | "OVERDUE";
  reason?: "AHEAD" | "BACKLOG" | "NO_PLAN";
  notUpdated?: boolean; daysLate?: number; daysOverdue?: number; daysFromPlan?: number;
}
export interface PlanReport {
  projectName: string; from: string; to: string; today: string;
  summary: { planned: number; completed: number; onTime: number; late: number; pending: number; overdue: number; notUpdated: number; extra: number; totalCompleted: number; percent: number };
  byPhase: { phase: string; label: string; planned: number; completed: number; extra: number }[];
  byCluster: { cluster: string; planned: number; completed: number; extra: number }[];
  planned: PlanRow[];
  extra: PlanRow[];
}
export interface WorkPlanMailConfig { projectName: string; recipients: string; dailyEnabled: boolean; weeklyEnabled: boolean; lastSentAt?: string; lastSendResult?: string }

export const villaConstructionService = {
  planReport: async (projectName: string, from: string, to: string): Promise<PlanReport> =>
    (await api.get("/villa-construction/plan/report", { params: { projectName, from, to } })).data,
  planMailConfig: async (projectName: string): Promise<WorkPlanMailConfig> =>
    (await api.get("/villa-construction/plan/mail-config", { params: { projectName } })).data,
  savePlanMailConfig: async (c: WorkPlanMailConfig): Promise<WorkPlanMailConfig> =>
    (await api.put("/villa-construction/plan/mail-config", c)).data,
  planMailPreview: async (projectName: string, type: "daily" | "weekly"): Promise<string> =>
    (await api.get("/villa-construction/plan/mail-preview", { params: { projectName, type }, responseType: "text" })).data,
  sendPlanMail: async (projectName: string, type: "daily" | "weekly"): Promise<string> =>
    (await api.post("/villa-construction/plan/send", null, { params: { projectName, type }, timeout: 60000 })).data.message,

  /** Admin: import planned dates / completed stages. value = "COMPLETED" | "yyyy-MM-dd" | "" */
  importSchedule: async (projectName: string, cells: { villa: number; phase: string; value: string }[], dryRun: boolean): Promise<ScheduleImportResult> => {
    const res = await api.post("/villa-construction/import", { projectName, cells, dryRun }, { timeout: 120000 });
    return res.data;
  },

  getAllByProject: async (projectName: string): Promise<VillaConstructionStatusDto[]> => {
    const res = await api.get("/villa-construction", { params: { projectName } });
    return res.data;
  },

  getByPhase: async (projectName: string, phase: string): Promise<VillaConstructionStatusDto[]> => {
    const res = await api.get("/villa-construction/phase", { params: { projectName, phase } });
    return res.data;
  },

  toggleStatus: async (
    projectName: string,
    villaNumber: number,
    phase: string,
    activityIndex: number
  ): Promise<VillaConstructionStatusDto> => {
    const res = await api.post("/villa-construction/toggle", {
      projectName,
      villaNumber,
      phase,
      activityIndex,
    });
    return res.data;
  },

  updateDetails: async (
    projectName: string,
    villaNumber: number,
    phase: string,
    activityIndex: number,
    done: boolean,
    incharge: string,
    plannedTargetDate: string,
    revisedPlannedDate: string,
    actualCompletionDate: string
  ): Promise<VillaConstructionStatusDto> => {
    const res = await api.post("/villa-construction/update-details", {
      projectName,
      villaNumber,
      phase,
      activityIndex,
      done,
      incharge,
      plannedTargetDate,
      revisedPlannedDate,
      actualCompletionDate,
    });
    return res.data;
  },

  getSummary: async (
    projectName: string
  ): Promise<Record<string, VillaConstructionStatusDto[]>> => {
    const res = await api.get("/villa-construction/summary", { params: { projectName } });
    return res.data;
  },

  getInchargeLogs: async (
    projectName: string,
    villaNumber?: number
  ): Promise<VillaInchargeLogDto[]> => {
    const params: Record<string, string | number> = { projectName };
    if (villaNumber !== undefined) params.villaNumber = villaNumber;
    const res = await api.get("/villa-construction/incharge-logs", { params });
    return res.data;
  },
};
