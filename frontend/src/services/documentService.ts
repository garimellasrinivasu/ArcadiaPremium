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
  updatedAt?: string | null;
  updatedBy?: string | null;
}

/** An earlier copy of a document, kept each time its content is replaced */
export interface DocumentVersionDto {
  id: number;
  versionNumber: number;
  fileSize: number;
  createdBy: string | null;
  createdAt: string | null;
  replacedBy: string | null;
  replacedAt: string | null;
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

  /** Get PPTX slide count */
  async getSlideCount(id: number): Promise<{ totalSlides: number }> {
    const { data } = await api.get(`/documents/${id}/slides`);
    return data;
  },

  /** Get URL for a single slide image (rendered as JPEG) */
  getSlideImageUrl(id: number, slideIndex: number, width = 960): string {
    const base = api.defaults.baseURL || "/api";
    return `${base}/documents/${id}/slides/${slideIndex}?width=${width}`;
  },

  /** Replace a document's file (in-app Excel editor). The server keeps the previous file as a version. */
  async replaceContent(id: number, data: Uint8Array, fileName: string, contentType: string): Promise<DocumentDto> {
    const form = new FormData();
    form.append("file", new Blob([data as Uint8Array<ArrayBuffer>], { type: contentType }), fileName);
    const { data: dto } = await api.put<DocumentDto>(`/documents/${id}/content`, form, {
      timeout: 300000,
      headers: { "Content-Type": "multipart/form-data" }, // api defaults to JSON, which would serialise the form
    });
    return dto;
  },

  /** Earlier versions of a document, newest first */
  async listVersions(id: number): Promise<DocumentVersionDto[]> {
    const { data } = await api.get<DocumentVersionDto[]>(`/documents/${id}/versions`);
    return data;
  },

  /** Download an earlier version as a Blob */
  async downloadVersion(id: number, versionId: number): Promise<Blob> {
    const { data } = await api.get(`/documents/${id}/versions/${versionId}`, { responseType: "blob" });
    return data;
  },

  /** Make an earlier version the current file (current file is kept as a version first) */
  async restoreVersion(id: number, versionId: number): Promise<DocumentDto> {
    const { data } = await api.post<DocumentDto>(`/documents/${id}/versions/${versionId}/restore`);
    return data;
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
