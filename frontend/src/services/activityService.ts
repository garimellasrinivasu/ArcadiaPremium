import api from "./api";

export interface ActivityGroupDto {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivitySubGroupDto {
  id: number;
  name: string;
  description?: string;
  activityGroupId: number;
  activityGroupName: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityMasterDto {
  id: number;
  name: string;
  description?: string;
  activityGroupId: number;
  activityGroupName: string;
  activitySubGroupId?: number;
  activitySubGroupName?: string;
  uom: string;
  sacCode?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Activity Group ───
export const activityGroupService = {
  async create(name: string, description?: string): Promise<ActivityGroupDto> {
    const res = await api.post("/activity-groups", { name, description });
    return res.data;
  },
  async getAll(): Promise<ActivityGroupDto[]> {
    const res = await api.get("/activity-groups");
    return res.data;
  },
  async getActive(): Promise<ActivityGroupDto[]> {
    const res = await api.get("/activity-groups/active");
    return res.data;
  },
  async getById(id: number): Promise<ActivityGroupDto> {
    const res = await api.get(`/activity-groups/${id}`);
    return res.data;
  },
  async update(id: number, name: string, description?: string): Promise<ActivityGroupDto> {
    const res = await api.put(`/activity-groups/${id}`, { name, description });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/activity-groups/${id}`);
  },
};

// ─── Activity Sub Group ───
export const activitySubGroupService = {
  async create(name: string, description: string | undefined, activityGroupId: number): Promise<ActivitySubGroupDto> {
    const res = await api.post("/activity-sub-groups", { name, description, activityGroupId });
    return res.data;
  },
  async getAll(): Promise<ActivitySubGroupDto[]> {
    const res = await api.get("/activity-sub-groups");
    return res.data;
  },
  async getByGroupId(groupId: number): Promise<ActivitySubGroupDto[]> {
    const res = await api.get("/activity-sub-groups/by-group", { params: { groupId } });
    return res.data;
  },
  async getById(id: number): Promise<ActivitySubGroupDto> {
    const res = await api.get(`/activity-sub-groups/${id}`);
    return res.data;
  },
  async update(id: number, name: string, description: string | undefined, activityGroupId: number): Promise<ActivitySubGroupDto> {
    const res = await api.put(`/activity-sub-groups/${id}`, { name, description, activityGroupId });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/activity-sub-groups/${id}`);
  },
};

// ─── Activity Master ───
export const activityMasterService = {
  async create(data: {
    name: string; description?: string; activityGroupId: number;
    activitySubGroupId?: number; uom: string; sacCode?: string;
  }): Promise<ActivityMasterDto> {
    const res = await api.post("/activities", data);
    return res.data;
  },
  async getAll(): Promise<ActivityMasterDto[]> {
    const res = await api.get("/activities");
    return res.data;
  },
  async getActive(): Promise<ActivityMasterDto[]> {
    const res = await api.get("/activities/active");
    return res.data;
  },
  async getByGroupId(groupId: number): Promise<ActivityMasterDto[]> {
    const res = await api.get("/activities/by-group", { params: { groupId } });
    return res.data;
  },
  async getBySubGroupId(subGroupId: number): Promise<ActivityMasterDto[]> {
    const res = await api.get("/activities/by-sub-group", { params: { subGroupId } });
    return res.data;
  },
  async getById(id: number): Promise<ActivityMasterDto> {
    const res = await api.get(`/activities/${id}`);
    return res.data;
  },
  async update(id: number, data: {
    name: string; description?: string; activityGroupId: number;
    activitySubGroupId?: number; uom: string; sacCode?: string;
  }): Promise<ActivityMasterDto> {
    const res = await api.put(`/activities/${id}`, data);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/activities/${id}`);
  },
};
