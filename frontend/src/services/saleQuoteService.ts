import api from "./api";

export interface SaleQuoteDto {
  id: number;
  quoteDate: string;
  customerName: string;
  customerPhone?: string;
  plotNo?: string;
  plotAreaSqYards: number;
  constructionRatio: number;
  totalConstructionSft: number;
  pricingOption: string;
  ratePerSft?: number;
  splitOtpPercent?: number;
  splitGeneralPercent?: number;
  splitOtpRate?: number;
  splitGeneralRate?: number;
  saleValue: number;
  clubHouseCharges?: number;
  corpusFund?: number;
  legalCharges?: number;
  cautionDeposit?: number;
  advanceMaintenance?: number;
  additionalChargesTotal?: number;
  plcTotal?: number;
  plcDetails?: string;
  extraLandSqYards?: number;
  landRatePerSqYard?: number;
  totalLandCost?: number;
  basicSaleValue?: number;
  grandTotal: number;
  amountInWords?: string;
  createdBy?: string;
  salesPerson?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSaleQuoteRequest {
  quoteDate: string;
  customerName: string;
  customerPhone?: string;
  plotNo?: string;
  plotAreaSqYards: number;
  constructionRatio: number;
  totalConstructionSft: number;
  pricingOption: string;
  ratePerSft?: number;
  splitOtpPercent?: number;
  splitGeneralPercent?: number;
  splitOtpRate?: number;
  splitGeneralRate?: number;
  saleValue: number;
  clubHouseCharges?: number;
  corpusFund?: number;
  legalCharges?: number;
  cautionDeposit?: number;
  advanceMaintenance?: number;
  additionalChargesTotal?: number;
  plcTotal?: number;
  plcDetails?: string;
  extraLandSqYards?: number;
  landRatePerSqYard?: number;
  totalLandCost?: number;
  basicSaleValue?: number;
  grandTotal: number;
  amountInWords?: string;
  salesPerson?: string;
  notes?: string;
}

export const saleQuoteService = {
  async create(req: CreateSaleQuoteRequest): Promise<SaleQuoteDto> {
    const res = await api.post("/sale-quotes", req);
    return res.data;
  },

  async getAll(): Promise<SaleQuoteDto[]> {
    const res = await api.get("/sale-quotes");
    return res.data;
  },

  async getById(id: number): Promise<SaleQuoteDto> {
    const res = await api.get(`/sale-quotes/${id}`);
    return res.data;
  },

  async getByDateRange(from: string, to: string): Promise<SaleQuoteDto[]> {
    const res = await api.get("/sale-quotes/date-range", { params: { from, to } });
    return res.data;
  },

  async search(q?: string, from?: string, to?: string): Promise<SaleQuoteDto[]> {
    const res = await api.get("/sale-quotes/search", { params: { q, from, to } });
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/sale-quotes/${id}`);
  },
};
