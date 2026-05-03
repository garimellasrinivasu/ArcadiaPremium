import api from "./api";

export interface DocumentDto {
  id: number;
  projectName: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  folderId: number | null;
  uploadedBy: string;
  createdAt: string;
}

export interface UploadHandle {
  promise: Promise<DocumentDto>;
  abort: () => void;
}

export const documentService = {
  /**
   * Upload a document with progress tracking and cancellation.
   * Returns an UploadHandle with a promise and an abort() function.
   */
  uploadWithProgress(
    projectName: string,
    file: File,
    onProgress: (loaded: number, total: number) => void,
    customFileName?: string,
    folderId?: number | null
  ): UploadHandle {
    const formData = new FormData();
    formData.append("projectName", projectName);
    formData.append("file", file);
    if (customFileName && customFileName.trim()) {
      formData.append("fileName", customFileName.trim());
    }
    if (folderId != null) {
      formData.append("folderId", folderId.toString());
    }

    const xhr = new XMLHttpRequest();
    const token = sessionStorage.getItem("token") || "";

    const promise = new Promise<DocumentDto>((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded, e.total);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid server response"));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

      const base = api.defaults.baseURL || "/api";
      xhr.open("POST", `${base}/documents`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });

    return { promise, abort: () => xhr.abort() };
  },

  /** List documents for a project in a specific folder (null = root) */
  async listByProject(
    projectName: string,
    folderId?: number | null
  ): Promise<DocumentDto[]> {
    const params: Record<string, string | number> = { projectName };
    if (folderId != null) {
      params.folderId = folderId;
    }
    const { data } = await api.get<DocumentDto[]>("/documents", { params });
    return data;
  },

  /** Get the download/view URL for a document */
  getViewUrl(id: number): string {
    const base = api.defaults.baseURL || "/api";
    return `${base}/documents/${id}`;
  },

  /** Create a temporary share token for Office Online viewer */
  async createShareToken(id: number): Promise<string> {
    const { data } = await api.post<{ token: string }>(`/documents/${id}/share`);
    return data.token;
  },

  /** Get a public URL for a shared document (no auth needed) */
  getPublicUrl(token: string): string {
    const origin = window.location.origin;
    return `${origin}/api/documents/public/${token}`;
  },

  /** Delete a document (admin only) */
  async delete(id: number): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  /** Bulk delete documents */
  bulkDelete: (ids: number[]) =>
    api.delete("/documents/bulk", { data: { ids } }).then((r) => r.data),

  /** Search documents across all projects by partial filename */
  search: (query: string) =>
    api.get<DocumentDto[]>("/documents/search", { params: { q: query } }).then((r) => r.data),
};
