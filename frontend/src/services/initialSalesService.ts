import api from "./api";

export interface InitialSaleDto {
  id: number;
  customerName: string;
  sqYardsVilla: number;
  villaNumber: string;
  saleMode: string;
  projectName: string;
  sftPerSqYard: number;
  salePricePerSft: number;
  defaultFacing: string;
  facingCharges: number;
  extraLandSqYards: number;
  extraLandPricePerSqYard: number;
  paymentTillNow: number;
  totalSftPerVilla: number;
  totalSftPrice: number;
  extraLandTotal: number;
  basePriceAmount: number;
  balanceInBasePrice: number;
  newSftPerSqYard: number;
  newSalePricePerSft: number;
  newDefaultFacing: string;
  newFacingCharges: number;
  newExtraLandSqYards: number;
  newExtraLandPricePerSqYard: number;
  newPaymentTillNow: number;
  newTotalSftPerVilla: number;
  newTotalSftPrice: number;
  newExtraLandTotal: number;
  newBasePriceAmount: number;
  newBalanceInBasePrice: number;
  clubHouseApplicable: boolean;
  clubHouseAmount: number;
  corpusFundApplicable: boolean;
  corpusFundAmount: number;
  legalChargesApplicable: boolean;
  legalChargesAmount: number;
  cautionDepositApplicable: boolean;
  cautionDepositAmount: number;
  advanceMaintenanceApplicable: boolean;
  advanceMaintenanceRate: number;
  advanceMaintenanceMonths: number;
  advanceMaintenanceAmount: number;
  newAdvanceMaintenanceAmount: number;
  registrationPaymentApplicable: boolean;
  gstPercentage: number;
  gstAmount: number;
  newGstAmount: number;
  stampDutyPercentage: number;
  stampDutyAmount: number;
  newStampDutyAmount: number;
  landRatePerSqYard: number;
  newLandRatePerSqYard: number;
  totalLandCost: number;
  newTotalLandCost: number;
  basicSaleValue: number;
  newBasicSaleValue: number;
  salePriceRowsJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInitialSaleRequest {
  customerName: string;
  sqYardsVilla: number;
  villaNumber: string;
  saleMode: string;
  projectName?: string;
  sftPerSqYard: number;
  salePricePerSft: number;
  defaultFacing: string;
  facingCharges: number;
  extraLandSqYards: number;
  extraLandPricePerSqYard: number;
  paymentTillNow: number;
  totalSftPerVilla: number;
  totalSftPrice: number;
  extraLandTotal: number;
  basePriceAmount: number;
  balanceInBasePrice: number;
  newSftPerSqYard: number;
  newSalePricePerSft: number;
  newDefaultFacing: string;
  newFacingCharges: number;
  newExtraLandSqYards: number;
  newExtraLandPricePerSqYard: number;
  newPaymentTillNow: number;
  newTotalSftPerVilla: number;
  newTotalSftPrice: number;
  newExtraLandTotal: number;
  newBasePriceAmount: number;
  newBalanceInBasePrice: number;
  clubHouseApplicable?: boolean;
  clubHouseAmount?: number;
  corpusFundApplicable?: boolean;
  corpusFundAmount?: number;
  legalChargesApplicable?: boolean;
  legalChargesAmount?: number;
  cautionDepositApplicable?: boolean;
  cautionDepositAmount?: number;
  advanceMaintenanceApplicable?: boolean;
  advanceMaintenanceRate?: number;
  advanceMaintenanceMonths?: number;
  advanceMaintenanceAmount?: number;
  newAdvanceMaintenanceAmount?: number;
  registrationPaymentApplicable?: boolean;
  gstPercentage?: number;
  gstAmount?: number;
  newGstAmount?: number;
  stampDutyPercentage?: number;
  stampDutyAmount?: number;
  newStampDutyAmount?: number;
  landRatePerSqYard?: number;
  newLandRatePerSqYard?: number;
  totalLandCost?: number;
  newTotalLandCost?: number;
  basicSaleValue?: number;
  newBasicSaleValue?: number;
  salePriceRowsJson?: string;
}

export const initialSalesService = {
  getAll: () =>
    api.get<InitialSaleDto[]>("/initial-sales").then((r) => r.data),

  getById: (id: number) =>
    api.get<InitialSaleDto>(`/initial-sales/${id}`).then((r) => r.data),

  getByProject: (projectName: string) =>
    api.get<InitialSaleDto[]>("/initial-sales/by-project", { params: { projectName } }).then((r) => r.data),

  search: (query: string) =>
    api.get<InitialSaleDto[]>("/initial-sales/search", { params: { query } }).then((r) => r.data),

  create: (req: CreateInitialSaleRequest) =>
    api.post<InitialSaleDto>("/initial-sales", req).then((r) => r.data),

  update: (id: number, req: CreateInitialSaleRequest) =>
    api.put<InitialSaleDto>(`/initial-sales/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/initial-sales/${id}`).then((r) => r.data),
};
