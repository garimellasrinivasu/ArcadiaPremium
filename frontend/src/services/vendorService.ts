import api from "./api";

export interface VendorDto {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan?: string;
  gstNo?: string;
  vendorType: "MATERIAL_SUPPLIER" | "SERVICE_PROVIDER";
  trade?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  active: boolean;
  remarks?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVendorRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan?: string;
  gstNo?: string;
  vendorType: "MATERIAL_SUPPLIER" | "SERVICE_PROVIDER";
  trade?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  active?: boolean;
  remarks?: string;
}

export const vendorService = {
  async getAll(): Promise<VendorDto[]> {
    const res = await api.get("/vendors");
    return res.data;
  },
  async getActive(): Promise<VendorDto[]> {
    const res = await api.get("/vendors/active");
    return res.data;
  },
  async search(q: string): Promise<VendorDto[]> {
    const res = await api.get("/vendors/search", { params: { q } });
    return res.data;
  },
  async getById(id: number): Promise<VendorDto> {
    const res = await api.get(`/vendors/${id}`);
    return res.data;
  },
  async create(req: CreateVendorRequest): Promise<VendorDto> {
    const res = await api.post("/vendors", req);
    return res.data;
  },
  async update(id: number, req: CreateVendorRequest): Promise<VendorDto> {
    const res = await api.put(`/vendors/${id}`, req);
    return res.data;
  },
  async toggleActive(id: number): Promise<VendorDto> {
    const res = await api.put(`/vendors/${id}/toggle-active`);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },
};
