import api from "./api";

export interface JobDto {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  projectName: string;
  unitName?: string;
  status: string;
  activityIds: number[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateJobRequest {
  name: string;
  description?: string;
  projectId: number;
  unitName?: string;
  activityIds: number[];
}

export interface EstimationDOMDto {
  id?: number;
  jobEstimationId?: number;
  itemNo?: number;
  description?: string;
  nos: number;
  length: number;
  breadth: number;
  height: number;
  quantity: number;
}

export interface JobEstimationDto {
  id: number;
  jobId: number;
  jobName: string;
  activityId: number;
  activityName: string;
  activityUom: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks?: string;
  domDetails: EstimationDOMDto[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEstimationDOMRequest {
  itemNo?: number;
  description?: string;
  nos: number;
  length: number;
  breadth: number;
  height: number;
}

export interface CreateJobEstimationRequest {
  jobId: number;
  activityId: number;
  quantity?: number;
  rate: number;
  remarks?: string;
  domDetails: CreateEstimationDOMRequest[];
}

export interface WorkOrderItemDto {
  id?: number;
  workOrderId?: number;
  activityId: number;
  activityName: string;
  description?: string;
  uom: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface WorkOrderDto {
  id: number;
  woNumber: string;
  jobId: number;
  jobName: string;
  contractorId: number;
  contractorName: string;
  woDate: string;
  startDate?: string;
  endDate?: string;
  status: string;
  totalAmount: number;
  termsAndConditions?: string;
  remarks?: string;
  items: WorkOrderItemDto[];
  contractType?: string;
  woAdvanceType?: string;
  woAdvanceValue?: number;
  woRetentionType?: string;
  woRetentionValue?: number;
  workDuration?: number;
  defectLiabilityPeriod?: string;
  dateOfCompletion?: string;
  contactPerson?: string;
  workOrderTitle?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWorkOrderItemRequest {
  activityId: number;
  description?: string;
  uom: string;
  quantity: number;
  rate: number;
}

export interface CreateWorkOrderRequest {
  jobId: number;
  contractorId: number;
  woDate: string;
  startDate?: string;
  endDate?: string;
  termsAndConditions?: string;
  remarks?: string;
  contractType?: string;
  woAdvanceType?: string;
  woAdvanceValue?: number;
  woRetentionType?: string;
  woRetentionValue?: number;
  workDuration?: number;
  defectLiabilityPeriod?: string;
  dateOfCompletion?: string;
  contactPerson?: string;
  workOrderTitle?: string;
  items: CreateWorkOrderItemRequest[];
}

// ─── Job Service ───
export const jobService = {
  async create(req: CreateJobRequest): Promise<JobDto> {
    const res = await api.post("/jobs", req);
    return res.data;
  },
  async getAll(): Promise<JobDto[]> {
    const res = await api.get("/jobs");
    return res.data;
  },
  async getByProject(projectId: number): Promise<JobDto[]> {
    const res = await api.get("/jobs/by-project", { params: { projectId } });
    return res.data;
  },
  async getById(id: number): Promise<JobDto> {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },
  async update(id: number, req: CreateJobRequest): Promise<JobDto> {
    const res = await api.put(`/jobs/${id}`, req);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<JobDto> {
    const res = await api.put(`/jobs/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },
};

// ─── Job Estimation Service ───
export const jobEstimationService = {
  async create(req: CreateJobEstimationRequest): Promise<JobEstimationDto> {
    const res = await api.post("/job-estimations", req);
    return res.data;
  },
  async getByJob(jobId: number): Promise<JobEstimationDto[]> {
    const res = await api.get("/job-estimations/by-job", { params: { jobId } });
    return res.data;
  },
  async getById(id: number): Promise<JobEstimationDto> {
    const res = await api.get(`/job-estimations/${id}`);
    return res.data;
  },
  async update(id: number, req: CreateJobEstimationRequest): Promise<JobEstimationDto> {
    const res = await api.put(`/job-estimations/${id}`, req);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/job-estimations/${id}`);
  },
};

// ─── Work Order Service ───
export const workOrderService = {
  async create(req: CreateWorkOrderRequest): Promise<WorkOrderDto> {
    const res = await api.post("/work-orders", req);
    return res.data;
  },
  async getAll(): Promise<WorkOrderDto[]> {
    const res = await api.get("/work-orders");
    return res.data;
  },
  async getByJob(jobId: number): Promise<WorkOrderDto[]> {
    const res = await api.get("/work-orders/by-job", { params: { jobId } });
    return res.data;
  },
  async getByContractor(contractorId: number): Promise<WorkOrderDto[]> {
    const res = await api.get("/work-orders/by-contractor", { params: { contractorId } });
    return res.data;
  },
  async getById(id: number): Promise<WorkOrderDto> {
    const res = await api.get(`/work-orders/${id}`);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<WorkOrderDto> {
    const res = await api.put(`/work-orders/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/work-orders/${id}`);
  },
};
