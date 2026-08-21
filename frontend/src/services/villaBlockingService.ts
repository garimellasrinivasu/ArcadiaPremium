import api from "./api";

export interface VillaBlockingDto {
  id?: number;
  villaNumber: number;
  projectName?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingAmount?: number;
  notes?: string;
  blockedBy?: string;
  blockedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const villaBlockingService = {
  async getAll(projectName?: string): Promise<VillaBlockingDto[]> {
    const params = projectName ? { projectName } : {};
    const { data } = await api.get<VillaBlockingDto[]>("/villa-blocking", { params });
    return data;
  },

  async getByVillaNumber(villaNumber: number): Promise<VillaBlockingDto | null> {
    try {
      const { data } = await api.get<VillaBlockingDto>(`/villa-blocking/${villaNumber}`);
      return data;
    } catch {
      return null;
    }
  },

  async blockVilla(dto: VillaBlockingDto): Promise<VillaBlockingDto> {
    const { data } = await api.post<VillaBlockingDto>("/villa-blocking", dto);
    return data;
  },

  async updateBlockedVilla(villaNumber: number, dto: VillaBlockingDto, projectName: string = "Arcadia"): Promise<VillaBlockingDto> {
    const { data } = await api.put<VillaBlockingDto>(`/villa-blocking/${villaNumber}`, dto, { params: { projectName } });
    return data;
  },

  async unblockVilla(villaNumber: number, projectName: string = "Arcadia"): Promise<void> {
    await api.delete(`/villa-blocking/${villaNumber}`, { params: { projectName } });
  },
};
