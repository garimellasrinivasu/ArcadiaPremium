import api from "./api";

export interface WOTemplateDto {
  id: number;
  code: string;
  name: string;
  description: string;
  defaultContractType: string;
  defaultTermsAndConditions: string;
  defaultAdvanceType: string;
  defaultAdvanceValue: number;
  defaultRetentionType: string;
  defaultRetentionValue: number;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const woTemplateService = {
  getAll: async (): Promise<WOTemplateDto[]> => {
    const res = await api.get("/wo-templates");
    return res.data;
  },
  getActive: async (): Promise<WOTemplateDto[]> => {
    const res = await api.get("/wo-templates/active");
    return res.data;
  },
  getById: async (id: number): Promise<WOTemplateDto> => {
    const res = await api.get(`/wo-templates/${id}`);
    return res.data;
  },
  create: async (data: Record<string, any>): Promise<WOTemplateDto> => {
    const res = await api.post("/wo-templates", data);
    return res.data;
  },
  update: async (id: number, data: Record<string, any>): Promise<WOTemplateDto> => {
    const res = await api.put(`/wo-templates/${id}`, data);
    return res.data;
  },
  toggleActive: async (id: number): Promise<WOTemplateDto> => {
    const res = await api.put(`/wo-templates/${id}/toggle-active`);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/wo-templates/${id}`);
  },
};
