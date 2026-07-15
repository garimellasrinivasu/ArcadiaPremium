import api from "./api";

export interface VillaBlockingDto {
  id?: number;
  villaNumber: number;
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
  async getAll(): Promise<VillaBlockingDto[]> {
    const { data } = await api.get<VillaBlockingDto[]>("/villa-blocking");
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

  async updateBlockedVilla(villaNumber: number, dto: VillaBlockingDto): Promise<VillaBlockingDto> {
    const { data } = await api.put<VillaBlockingDto>(`/villa-blocking/${villaNumber}`, dto);
    return data;
  },

  async unblockVilla(villaNumber: number): Promise<void> {
    await api.delete(`/villa-blocking/${villaNumber}`);
  },
};
