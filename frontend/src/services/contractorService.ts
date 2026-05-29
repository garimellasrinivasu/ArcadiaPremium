import api from "./api";

export interface ContractorDto {
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
  contractorType: string;
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

export interface CreateContractorRequest {
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
  contractorType: string;
  trade?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  active?: boolean;
  remarks?: string;
}

export const contractorService = {
  async create(req: CreateContractorRequest): Promise<ContractorDto> {
    const res = await api.post("/contractors", req);
    return res.data;
  },
  async getAll(): Promise<ContractorDto[]> {
    const res = await api.get("/contractors");
    return res.data;
  },
  async getActive(): Promise<ContractorDto[]> {
    const res = await api.get("/contractors/active");
    return res.data;
  },
  async getByType(type: string): Promise<ContractorDto[]> {
    const res = await api.get("/contractors/type", { params: { type } });
    return res.data;
  },
  async search(name: string): Promise<ContractorDto[]> {
    const res = await api.get("/contractors/search", { params: { name } });
    return res.data;
  },
  async getById(id: number): Promise<ContractorDto> {
    const res = await api.get(`/contractors/${id}`);
    return res.data;
  },
  async update(id: number, req: CreateContractorRequest): Promise<ContractorDto> {
    const res = await api.put(`/contractors/${id}`, req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/contractors/${id}`);
  },
  async toggleActive(id: number): Promise<ContractorDto> {
    const res = await api.put(`/contractors/${id}/toggle-active`);
    return res.data;
  },
};
