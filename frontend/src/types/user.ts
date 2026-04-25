export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: Role[];
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
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleIds: number[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleIds?: number[];
  active?: boolean;
}

// --- Sale Entry types ---

export interface SaleEntry {
  id: number;
  serialNo: number;
  bookingDate: string;
  project: string;
  spgPraneeth?: string;
  tokenNumber?: string;
  customerName: string;
  personalCompany?: string;
  sol?: string;
  typeOfSale?: string;
  landExtentSqYards?: number;
  sbuaSft?: number;
  facing?: string;
  basePricePerSft?: number;
  amenitiesPremiums?: string;
  totalSalesConsideration?: number;
  receivedAmount?: number;
  balanceToReceive?: number;
  balancePlanApproved?: number;
  balanceDuringExecution?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleEntryRequest {
  bookingDate: string;
  project: string;
  spgPraneeth?: string;
  tokenNumber?: string;
  customerName: string;
  personalCompany?: string;
  sol?: string;
  typeOfSale?: string;
  landExtentSqYards?: number;
  sbuaSft?: number;
  facing?: string;
  basePricePerSft?: number;
  amenitiesPremiums?: string;
  receivedAmount?: number;
  remarks?: string;
}

export interface UpdatePaymentRequest {
  receivedAmount: number;
  remarks?: string;
}
