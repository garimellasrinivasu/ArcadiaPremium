import api from "./api";

// ── Material Group ──────────────────────────────────────────────────────

export interface MaterialGroupDto {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaterialGroupRequest {
  name: string;
  description?: string;
}

export const materialGroupService = {
  async getAll(): Promise<MaterialGroupDto[]> {
    const res = await api.get("/material-groups");
    return res.data;
  },
  async getById(id: number): Promise<MaterialGroupDto> {
    const res = await api.get(`/material-groups/${id}`);
    return res.data;
  },
  async create(req: CreateMaterialGroupRequest): Promise<MaterialGroupDto> {
    const res = await api.post("/material-groups", req);
    return res.data;
  },
  async update(id: number, req: CreateMaterialGroupRequest): Promise<MaterialGroupDto> {
    const res = await api.put(`/material-groups/${id}`, req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/material-groups/${id}`);
  },
};

// ── Material Sub Group ──────────────────────────────────────────────────

export interface MaterialSubGroupDto {
  id: number;
  name: string;
  description?: string;
  materialGroupId: number;
  materialGroupName?: string;
  tolerancePercent?: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaterialSubGroupRequest {
  name: string;
  description?: string;
  materialGroupId: number;
  tolerancePercent?: number;
}

export const materialSubGroupService = {
  async getAll(): Promise<MaterialSubGroupDto[]> {
    const res = await api.get("/material-sub-groups");
    return res.data;
  },
  async getByGroup(groupId: number): Promise<MaterialSubGroupDto[]> {
    const res = await api.get("/material-sub-groups/by-group", { params: { groupId } });
    return res.data;
  },
  async getById(id: number): Promise<MaterialSubGroupDto> {
    const res = await api.get(`/material-sub-groups/${id}`);
    return res.data;
  },
  async create(req: CreateMaterialSubGroupRequest): Promise<MaterialSubGroupDto> {
    const res = await api.post("/material-sub-groups", req);
    return res.data;
  },
  async update(id: number, req: CreateMaterialSubGroupRequest): Promise<MaterialSubGroupDto> {
    const res = await api.put(`/material-sub-groups/${id}`, req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/material-sub-groups/${id}`);
  },
};

// ── Material Master ─────────────────────────────────────────────────────

export interface MaterialMasterDto {
  id: number;
  name: string;
  description?: string;
  materialGroupId: number;
  materialGroupName?: string;
  materialSubGroupId?: number;
  materialSubGroupName?: string;
  uom: string;
  hsnCode?: string;
  brand?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaterialMasterRequest {
  name: string;
  description?: string;
  materialGroupId: number;
  materialSubGroupId?: number;
  uom: string;
  hsnCode?: string;
  brand?: string;
}

export const materialMasterService = {
  async getAll(): Promise<MaterialMasterDto[]> {
    const res = await api.get("/materials");
    return res.data;
  },
  async getActive(): Promise<MaterialMasterDto[]> {
    const res = await api.get("/materials/active");
    return res.data;
  },
  async getByGroup(groupId: number): Promise<MaterialMasterDto[]> {
    const res = await api.get("/materials/by-group", { params: { groupId } });
    return res.data;
  },
  async getBySubGroup(subGroupId: number): Promise<MaterialMasterDto[]> {
    const res = await api.get("/materials/by-sub-group", { params: { subGroupId } });
    return res.data;
  },
  async getById(id: number): Promise<MaterialMasterDto> {
    const res = await api.get(`/materials/${id}`);
    return res.data;
  },
  async create(req: CreateMaterialMasterRequest): Promise<MaterialMasterDto> {
    const res = await api.post("/materials", req);
    return res.data;
  },
  async update(id: number, req: CreateMaterialMasterRequest): Promise<MaterialMasterDto> {
    const res = await api.put(`/materials/${id}`, req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/materials/${id}`);
  },
};

// ── Vendor-Material Mapping ─────────────────────────────────────────────

export interface VendorMaterialMappingDto {
  id: number;
  vendorId: number;
  vendorName?: string;
  materialId: number;
  materialName?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVendorMaterialMappingRequest {
  vendorId: number;
  materialId: number;
}

export const vendorMaterialMappingService = {
  async getAll(): Promise<VendorMaterialMappingDto[]> {
    const res = await api.get("/vendor-material-mappings");
    return res.data;
  },
  async getByVendor(vendorId: number): Promise<VendorMaterialMappingDto[]> {
    const res = await api.get("/vendor-material-mappings/by-vendor", { params: { vendorId } });
    return res.data;
  },
  async getByMaterial(materialId: number): Promise<VendorMaterialMappingDto[]> {
    const res = await api.get("/vendor-material-mappings/by-material", { params: { materialId } });
    return res.data;
  },
  async create(req: CreateVendorMaterialMappingRequest): Promise<VendorMaterialMappingDto> {
    const res = await api.post("/vendor-material-mappings", req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/vendor-material-mappings/${id}`);
  },
};

// ── Material Rate ───────────────────────────────────────────────────────

export interface MaterialRateDto {
  id: number;
  vendorId: number;
  vendorName?: string;
  materialId: number;
  materialName?: string;
  rate: number;
  rateDate: string;
  approved: boolean;
  approvedBy?: string;
  approvedDate?: string;
  status?: string;
  submittedBy?: string;
  rejectionReason?: string;
  taxPercent?: number;
  taxType?: string;
  remarks?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaterialRateRequest {
  vendorId: number;
  materialId: number;
  rate: number;
  rateDate: string;
  taxPercent?: number;
  taxType?: string;
  remarks?: string;
}

export const materialRateService = {
  async getAll(): Promise<MaterialRateDto[]> {
    const res = await api.get("/material-rates");
    return res.data;
  },
  async getByVendor(vendorId: number): Promise<MaterialRateDto[]> {
    const res = await api.get("/material-rates/by-vendor", { params: { vendorId } });
    return res.data;
  },
  async getByMaterial(materialId: number): Promise<MaterialRateDto[]> {
    const res = await api.get("/material-rates/by-material", { params: { materialId } });
    return res.data;
  },
  async getById(id: number): Promise<MaterialRateDto> {
    const res = await api.get(`/material-rates/${id}`);
    return res.data;
  },
  async create(req: CreateMaterialRateRequest): Promise<MaterialRateDto> {
    const res = await api.post("/material-rates", req);
    return res.data;
  },
  async approve(id: number): Promise<MaterialRateDto> {
    const res = await api.put(`/material-rates/${id}/approve`);
    return res.data;
  },
  async submit(id: number): Promise<MaterialRateDto> {
    const res = await api.put(`/material-rates/${id}/submit`);
    return res.data;
  },
  async reject(id: number, rejectionReason: string): Promise<MaterialRateDto> {
    const res = await api.put(`/material-rates/${id}/reject`, { rejectionReason });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/material-rates/${id}`);
  },
};
