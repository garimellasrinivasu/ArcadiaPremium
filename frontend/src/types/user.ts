export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role | null;
  allowedPages?: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  module: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  mustChangePassword: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleId: number;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleId?: number;
  active?: boolean;
}

// --- Sale Entry types ---

export interface PaymentEntry {
  id: number;
  saleEntryId: number;
  amount: number;
  paymentDate: string;
  paymentMode?: string;
  referenceNumber?: string;
  remarks?: string;
  createdAt: string;
}

export interface AddPaymentRequest {
  amount: number;
  paymentDate?: string;
  paymentMode?: string;
  referenceNumber?: string;
  remarks?: string;
}

export interface SaleEntry {
  id: number;
  serialNo: number;
  bookingDate: string;
  project: string;
  spgPraneeth?: string;
  saleInitiation?: string;
  tokenNumber?: string;
  customerName: string;
  personalCompany?: string;
  sol?: string;
  typeOfSale?: string;
  landExtentSqYards?: number;
  sftPerSqYard?: number;
  sbuaSft?: number;
  facing?: string;
  facingCharges?: number;
  basePricePerSft?: number;
  amenitiesPremiums?: string;
  totalSalesConsideration?: number;
  receivedAmount?: number;
  balanceToReceive?: number;
  balancePlanApproved?: number;
  balanceDuringExecution?: number;
  // Additional charges
  includeClubHouse?: boolean;
  clubHouseCharges?: number;
  includeCorpusFund?: boolean;
  corpusFund?: number;
  includeLegalDoc?: boolean;
  legalDocCharges?: number;
  includeCautionDeposit?: boolean;
  refundableCautionDeposit?: number;
  includeAdvanceMaintenance?: boolean;
  advanceMaintRatePerSft?: number;
  advanceMaintMonths?: number;
  advanceMaintenanceTotal?: number;
  totalAdditionalCharges?: number;
  grandTotal?: number;
  remarks?: string;
  payments?: PaymentEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleEntryRequest {
  bookingDate: string;
  project: string;
  spgPraneeth?: string;
  saleInitiation?: string;
  tokenNumber?: string;
  customerName: string;
  personalCompany?: string;
  sol?: string;
  typeOfSale?: string;
  landExtentSqYards?: number;
  sftPerSqYard?: number;
  sbuaSft?: number;
  facing?: string;
  facingCharges?: number;
  basePricePerSft?: number;
  amenitiesPremiums?: string;
  receivedAmount?: number;
  // Additional charges
  includeClubHouse?: boolean;
  clubHouseCharges?: number;
  includeCorpusFund?: boolean;
  corpusFund?: number;
  includeLegalDoc?: boolean;
  legalDocCharges?: number;
  includeCautionDeposit?: boolean;
  refundableCautionDeposit?: number;
  includeAdvanceMaintenance?: boolean;
  advanceMaintRatePerSft?: number;
  advanceMaintMonths?: number;
  remarks?: string;
}

export interface UpdatePaymentRequest {
  receivedAmount: number;
  remarks?: string;
}
