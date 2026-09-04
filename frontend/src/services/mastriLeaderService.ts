import api from "./api";

export interface MastriLeaderDto {
  id: number;
  name: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

export const mastriLeaderService = {
  getAll: () => api.get<MastriLeaderDto[]>("/mastri-leaders").then(r => r.data),
  getActive: () => api.get<MastriLeaderDto[]>("/mastri-leaders/active").then(r => r.data),
  create: (data: { name: string; phone?: string }) =>
    api.post<MastriLeaderDto>("/mastri-leaders", data).then(r => r.data),
  update: (id: number, data: { name: string; phone?: string; active?: boolean }) =>
    api.put<MastriLeaderDto>(`/mastri-leaders/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/mastri-leaders/${id}`).then(r => r.data),
};
