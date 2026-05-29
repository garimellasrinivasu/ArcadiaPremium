import api from "./api";

export interface PurchaseOrderItemDto {
  id: number;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  quantity: number;
  rate: number;
  taxPercent?: number;
  amount: number;
  receivedQuantity?: number;
  remarks?: string;
}

export interface PurchaseOrderDto {
  id: number;
  poNumber: string;
  projectId: number;
  projectName?: string;
  vendorId: number;
  vendorName?: string;
  poDate: string;
  deliveryDate?: string;
  referenceType?: string;
  indentId?: number;
  indentNo?: string;
  advancePercent?: number;
  totalAmount: number;
  taxAmount?: number;
  grandTotal?: number;
  status: string;
  billingTerms?: string;
  paymentTerms?: string;
  remarks?: string;
  items: PurchaseOrderItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePOItemRequest {
  materialId: number;
  quantity: number;
  rate: number;
  taxPercent?: number;
  remarks?: string;
}

export interface CreatePurchaseOrderRequest {
  projectId: number;
  vendorId: number;
  poDate: string;
  deliveryDate?: string;
  referenceType?: string;
  indentId?: number;
  advancePercent?: number;
  billingTerms?: string;
  paymentTerms?: string;
  remarks?: string;
  items: CreatePOItemRequest[];
}

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrderDto[]> {
    const res = await api.get("/purchase-orders");
    return res.data;
  },
  async getById(id: number): Promise<PurchaseOrderDto> {
    const res = await api.get(`/purchase-orders/${id}`);
    return res.data;
  },
  async getByProject(projectId: number): Promise<PurchaseOrderDto[]> {
    const res = await api.get(`/purchase-orders/by-project/${projectId}`);
    return res.data;
  },
  async getByVendor(vendorId: number): Promise<PurchaseOrderDto[]> {
    const res = await api.get(`/purchase-orders/by-vendor/${vendorId}`);
    return res.data;
  },
  async getByStatus(status: string): Promise<PurchaseOrderDto[]> {
    const res = await api.get(`/purchase-orders/by-status/${status}`);
    return res.data;
  },
  async create(req: CreatePurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const res = await api.post("/purchase-orders", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<PurchaseOrderDto> {
    const res = await api.put(`/purchase-orders/${id}/status`, { status });
    return res.data;
  },
  async getPrintData(id: number): Promise<any> {
    const res = await api.get(`/purchase-orders/${id}/print-data`);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/purchase-orders/${id}`);
  },
};
