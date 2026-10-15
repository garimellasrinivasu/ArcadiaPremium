import api from "./api";

/** The two document checklist pages */
export type TrackerType = "SALES_PREP" | "RERA_DOCS";
export type ChecklistStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "NOT_APPLICABLE";

export interface ChecklistPerms { view: boolean; upload: boolean; download: boolean; delete: boolean; editStatus: boolean }

export interface ChecklistFolderDto {
  id: number;
  /** "" or null when directly under the item */
  parentId: number | "" | null;
  name: string;
}

export interface ChecklistDocumentDto {
  id: number;
  itemId: number;
  folderId: number | null;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ChecklistItemDto {
  id: number;
  section: string;
  title: string;
  details: string | null;
  status: ChecklistStatus;
  /** SPG owner */
  owner: string | null;
  technicalOwner: string | null;
  targetDate: string | null;
  completedDate: string | null;
  remarks: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
  documents: ChecklistDocumentDto[];
  folders: ChecklistFolderDto[];
}

export interface ChecklistSummary {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  notApplicable: number;
  overdue: number;
  dueThisWeek: number;
  noTargetDate: number;
  percentComplete: number;
  owners: { owner: string; total: number; completed: number; pending: number; overdue: number; nextTarget?: string }[];
  sections: { section: string; total: number; completed: number }[];
  upcoming: { id: number; title: string; owner: string; targetDate: string; status: ChecklistStatus; overdue: boolean }[];
}

export interface ChecklistMailConfigDto {
  recipients: string;
  dailyEnabled: boolean;
  lastSentAt: string | null;
  lastSendResult: string | null;
}

export interface ChecklistUserPermissions {
  email: string;
  name: string;
  role: string | null;
  permissions: Record<TrackerType, ChecklistPerms>;
}

const base = (t: TrackerType) => `/checklists/${t}`;

export const checklistService = {
  myPermissions: () => api.get<Record<TrackerType, ChecklistPerms>>("/checklists/my-permissions").then((r) => r.data),
  listPermissions: () => api.get<ChecklistUserPermissions[]>("/checklists/permissions").then((r) => r.data),
  savePermission: (email: string, tracker: TrackerType, flags: ChecklistPerms) =>
    api.put("/checklists/permissions", { email, tracker, flags }).then((r) => r.data),

  items: (t: TrackerType, project: string) =>
    api.get<ChecklistItemDto[]>(`${base(t)}/items`, { params: { project } }).then((r) => r.data),
  createItem: (t: TrackerType, project: string, body: Partial<ChecklistItemDto>) =>
    api.post(`${base(t)}/items`, body, { params: { project } }).then((r) => r.data),
  updateItem: (t: TrackerType, id: number, body: Partial<Omit<ChecklistItemDto, "documents">>) =>
    api.put(`${base(t)}/items/${id}`, body).then((r) => r.data),
  deleteItem: (t: TrackerType, id: number) => api.delete(`${base(t)}/items/${id}`).then((r) => r.data),

  /** Large scans are allowed (up to 2 GB), so no request timeout; onProgress gets 0–100. */
  upload: (t: TrackerType, itemId: number, file: File, onProgress?: (pct: number, loaded: number) => void, signal?: AbortSignal, folderId?: number | null) => {
    const form = new FormData();
    form.append("file", file);
    if (folderId != null) form.append("folderId", String(folderId));
    return api.post(`${base(t)}/items/${itemId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" }, // api defaults to JSON, which would serialise the form
      timeout: 0,
      signal,
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0, e.loaded),
    }).then((r) => r.data);
  },
  createFolder: (t: TrackerType, itemId: number, name: string, parentId: number | null) =>
    api.post(`${base(t)}/items/${itemId}/folders`, { name, parentId }).then((r) => r.data),
  renameFolder: (t: TrackerType, folderId: number, name: string) => api.put(`${base(t)}/folders/${folderId}`, { name }).then((r) => r.data),
  deleteFolder: (t: TrackerType, folderId: number) => api.delete(`${base(t)}/folders/${folderId}`).then((r) => r.data),
  fetchDocument: (t: TrackerType, docId: number, download: boolean) =>
    api.get(`${base(t)}/documents/${docId}`, { params: { download }, responseType: "blob" }).then((r) => r.data as Blob),
  deleteDocument: (t: TrackerType, docId: number) => api.delete(`${base(t)}/documents/${docId}`).then((r) => r.data),

  summary: (t: TrackerType, project: string) =>
    api.get<ChecklistSummary>(`${base(t)}/summary`, { params: { project } }).then((r) => r.data),
  mailConfig: (t: TrackerType, project: string) =>
    api.get<ChecklistMailConfigDto>(`${base(t)}/mail-config`, { params: { project } }).then((r) => r.data),
  saveMailConfig: (t: TrackerType, project: string, recipients: string, dailyEnabled: boolean) =>
    api.put<ChecklistMailConfigDto>(`${base(t)}/mail-config`, { recipients, dailyEnabled }, { params: { project } }).then((r) => r.data),
  previewEmail: (t: TrackerType, project: string) =>
    api.get<string>(`${base(t)}/summary-email-preview`, { params: { project }, responseType: "text" }).then((r) => r.data),
  sendSummary: (t: TrackerType, project: string) =>
    api.post<{ message: string }>(`${base(t)}/send-summary`, null, { params: { project } }).then((r) => r.data),
};
