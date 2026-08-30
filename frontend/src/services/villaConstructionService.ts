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
  revisedPlannedDate?: string;
  delayInDays?: number;
  actualCompletionDate?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const villaConstructionService = {
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
};
