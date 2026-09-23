import api from "./api";

export interface ClusterInchargeDto {
  id: number;
  clusterNumber: number;
  inchargeName: string;
  villaNumbers: string | null;
  active: boolean;
  createdAt: string;
}

export const clusterInchargeService = {
  getAll: () => api.get<ClusterInchargeDto[]>("/cluster-incharges").then(r => r.data),
  getActive: () => api.get<ClusterInchargeDto[]>("/cluster-incharges/active").then(r => r.data),
  create: (data: { clusterNumber: number; inchargeName: string; villaNumbers?: string }) =>
    api.post<ClusterInchargeDto>("/cluster-incharges", data).then(r => r.data),
  update: (id: number, data: { clusterNumber: number; inchargeName: string; villaNumbers?: string; active?: boolean }) =>
    api.put<ClusterInchargeDto>(`/cluster-incharges/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/cluster-incharges/${id}`).then(r => r.data),
};
