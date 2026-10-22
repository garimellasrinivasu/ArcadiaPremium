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

export const villaConstructionService = {
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
