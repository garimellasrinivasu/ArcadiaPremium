import api from "./api";

export interface CapitolFundConfigDto {
  id: number;
  sftPrice: number;
  defaultInterestRate: number;
  updatedBy: string;
  updatedAt: string;
}

export const capitolFundService = {
  async getConfig(): Promise<CapitolFundConfigDto> {
    const { data } = await api.get<CapitolFundConfigDto>("/capitol-fund/config");
    return data;
  },

  async updateConfig(sftPrice: number, defaultInterestRate: number): Promise<CapitolFundConfigDto> {
    const { data } = await api.put<CapitolFundConfigDto>("/capitol-fund/config", {
      sftPrice,
      defaultInterestRate,
    });
    return data;
  },
};
