import api from "./api";

// ── Execution Template ─────────────────────────────────────────────────

export interface ExecutionTemplateTaskDto {
  id: number;
  taskName: string;
  sortOrder: number;
  estimatedDays: number;
}

export interface ExecutionTemplateDto {
  id: number;
  projectId: number;
  projectName: string;
  tasks: ExecutionTemplateTaskDto[];
  createdBy: string;
  createdAt: string;
}

export interface CreateExecutionTemplateRequest {
  projectId: number;
  tasks: {
    taskName: string;
    sortOrder: number;
    estimatedDays: number;
  }[];
}

export const executionTemplateService = {
  async create(req: CreateExecutionTemplateRequest): Promise<ExecutionTemplateDto> {
    const res = await api.post("/execution-templates", req);
    return res.data;
  },
  async getAll(): Promise<ExecutionTemplateDto[]> {
    const res = await api.get("/execution-templates");
    return res.data;
  },
  async getById(id: number): Promise<ExecutionTemplateDto> {
    const res = await api.get(`/execution-templates/${id}`);
    return res.data;
  },
  async getByProject(projectId: number): Promise<ExecutionTemplateDto[]> {
    const res = await api.get(`/execution-templates/by-project/${projectId}`);
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/execution-templates/${id}`);
  },
};

// ── Execution Task ─────────────────────────────────────────────────────

export interface ExecutionTaskDto {
  id: number;
  taskCode: string;
  projectId: number;
  projectName: string;
  taskName: string;
  unitOrBlock: string;
  assignedTo: string;
  status: string;
  completionPercentage: number;
  estimatedDays: number;
  startDate: string;
  completedDate: string;
  createdBy: string;
  createdAt: string;
}

export interface AllocateExecutionTaskRequest {
  templateId: number;
  unitOrBlock: string;
  assignedTo: string;
}

export interface CreateExecutionTaskRequest {
  projectId: number;
  taskName: string;
  unitOrBlock: string;
  assignedTo: string;
  estimatedDays: number;
}

export const executionTaskService = {
  async allocate(req: AllocateExecutionTaskRequest): Promise<ExecutionTaskDto[]> {
    const res = await api.post("/execution-tasks/from-template", req);
    return res.data;
  },
  async create(req: CreateExecutionTaskRequest): Promise<ExecutionTaskDto> {
    const res = await api.post("/execution-tasks", req);
    return res.data;
  },
  async getAll(): Promise<ExecutionTaskDto[]> {
    const res = await api.get("/execution-tasks");
    return res.data;
  },
  async getById(id: number): Promise<ExecutionTaskDto> {
    const res = await api.get(`/execution-tasks/${id}`);
    return res.data;
  },
  async getByProject(projectId: number): Promise<ExecutionTaskDto[]> {
    const res = await api.get(`/execution-tasks/by-project/${projectId}`);
    return res.data;
  },
  async getByAssigned(assignedTo: string): Promise<ExecutionTaskDto[]> {
    const res = await api.get(`/execution-tasks/by-assignee/${assignedTo}`);
    return res.data;
  },
  async updateStatus(id: number, status: string): Promise<ExecutionTaskDto> {
    const res = await api.put(`/execution-tasks/${id}/status`, { status });
    return res.data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/execution-tasks/${id}`);
  },
};

// ── Daily Execution Update ─────────────────────────────────────────────

export interface DailyExecutionUpdateDto {
  id: number;
  executionTaskId: number;
  taskCode: string;
  previousPercentage: number;
  newPercentage: number;
  updateDate: string;
  remarks: string;
  updatedBy: string;
  createdAt: string;
}

export interface CreateDailyExecutionUpdateRequest {
  executionTaskId: number;
  newPercentage: number;
  remarks: string;
}

export const dailyExecutionUpdateService = {
  async record(req: CreateDailyExecutionUpdateRequest): Promise<DailyExecutionUpdateDto> {
    const res = await api.post("/daily-execution-updates", req);
    return res.data;
  },
  async getByTask(taskId: number): Promise<DailyExecutionUpdateDto[]> {
    const res = await api.get(`/daily-execution-updates/by-task/${taskId}`);
    return res.data;
  },
  async getByDate(start: string, end: string): Promise<DailyExecutionUpdateDto[]> {
    const res = await api.get("/daily-execution-updates/by-date", { params: { start, end } });
    return res.data;
  },
};
