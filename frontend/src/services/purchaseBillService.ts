import api from "./api";

export interface PurchaseBillItemDto {
  id: number;
  materialId: number;
  materialName?: string;
  materialUom?: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks?: string;
}

export interface PurchaseBillDto {
  id: number;
  billNo: string;
  purchaseOrderId?: number;
  poNumber?: string;
  vendorId: number;
  vendorName?: string;
  billDate: string;
  vendorInvoiceNo?: string;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  recoveryAmount?: number;
  netAmount?: number;
  status: string;
  remarks?: string;
  vendorInvoiceFile?: string;
  vendorInvoiceFileName?: string;
  items: PurchaseBillItemDto[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePurchaseBillItemRequest {
  materialId: number;
  quantity: number;
  rate: number;
  amount: number;
  remarks?: string;
}

export interface CreatePurchaseBillRequest {
  purchaseOrderId?: number;
  vendorId: number;
  billNo: string;
  billDate: string;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  recoveryAmount?: number;
  netAmount?: number;
  remarks?: string;
  items: CreatePurchaseBillItemRequest[];
}

export const purchaseBillService = {
  async getAll(): Promise<PurchaseBillDto[]> {
    const res = await api.get("/purchase-bills");
    return res.data;
  },
  async getById(id: number): Promise<PurchaseBillDto> {
    const res = await api.get(`/purchase-bills/${id}`);
    return res.data;
  },
  async getByPurchaseOrder(poId: number): Promise<PurchaseBillDto[]> {
    const res = await api.get(`/purchase-bills/by-purchase-order/${poId}`);
    return res.data;
  },
  async getByVendor(vendorId: number): Promise<PurchaseBillDto[]> {
    const res = await api.get(`/purchase-bills/by-vendor/${vendorId}`);
    return res.data;
  },
  async create(req: CreatePurchaseBillRequest): Promise<PurchaseBillDto> {
    const res = await api.post("/purchase-bills", req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<PurchaseBillDto> {
    const res = await api.put(`/purchase-bills/${id}/status`, { status });
    return res.data;
  },
  async uploadInvoice(id: number, file: string, fileName: string): Promise<PurchaseBillDto> {
    const res = await api.put(`/purchase-bills/${id}/upload-invoice`, { file, fileName });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/purchase-bills/${id}`);
  },
};
