import api from "./api";

export interface TodoTaskDto {
  id: number;
  taskCode: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  targetDate: string;
  actualCompletionDate?: string;
  project?: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  assignedByName?: string;
  remarks?: string;
  dailyUpdate?: string;
  dailyUpdateAt?: string;
  reminderEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  daysRemaining?: number;
}

export interface CreateTodoTaskRequest {
  title: string;
  description?: string;
  category: string;
  priority: string;
  targetDate: string;
  project?: string;
  assignedTo: string;
  remarks?: string;
  reminderEnabled?: boolean;
}

export const todoTaskService = {
  /** Create a new task */
  create: (req: CreateTodoTaskRequest) =>
    api.post<TodoTaskDto>("/todo-tasks", req).then((r) => r.data),

  /** Update a task */
  update: (id: number, req: Partial<CreateTodoTaskRequest>) =>
    api.put<TodoTaskDto>(`/todo-tasks/${id}`, req).then((r) => r.data),

  /** Update task status */
  updateStatus: (id: number, status: string) =>
    api.patch<TodoTaskDto>(`/todo-tasks/${id}/status`, { status }).then((r) => r.data),

  /** Update daily progress note */
  updateDailyUpdate: (id: number, dailyUpdate: string) =>
    api.patch<TodoTaskDto>(`/todo-tasks/${id}/daily-update`, { dailyUpdate }).then((r) => r.data),

  /** Get tasks assigned to current user */
  getMyTasks: () =>
    api.get<TodoTaskDto[]>("/todo-tasks/my-tasks").then((r) => r.data),

  /** Get tasks assigned by current user */
  getAssignedByMe: () =>
    api.get<TodoTaskDto[]>("/todo-tasks/assigned-by-me").then((r) => r.data),

  /** Get all tasks (admin) */
  getAll: () =>
    api.get<TodoTaskDto[]>("/todo-tasks").then((r) => r.data),

  /** Get a single task */
  getById: (id: number) =>
    api.get<TodoTaskDto>(`/todo-tasks/${id}`).then((r) => r.data),

  /** Delete a task */
  delete: (id: number) =>
    api.delete(`/todo-tasks/${id}`).then((r) => r.data),

  /** Get overdue tasks */
  getOverdue: () =>
    api.get<TodoTaskDto[]>("/todo-tasks/overdue").then((r) => r.data),

  /** Test: Trigger daily reminder */
  testDailyReminder: () =>
    api.post<{ message: string }>("/todo-tasks/test/daily-reminder").then((r) => r.data),

  /** Test: Trigger weekly summary */
  testWeeklySummary: () =>
    api.post<{ message: string }>("/todo-tasks/test/weekly-summary").then((r) => r.data),
};
