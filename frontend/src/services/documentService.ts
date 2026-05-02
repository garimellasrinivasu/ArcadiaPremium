import api from "./api";

export interface DocumentDto {
  id: number;
  projectName: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export const documentService = {
  /** Upload a document for a project */
  async upload(
    projectName: string,
    file: File,
    customFileName?: string
  ): Promise<DocumentDto> {
    const formData = new FormData();
    formData.append("projectName", projectName);
    formData.append("file", file);
    if (customFileName && customFileName.trim()) {
      formData.append("fileName", customFileName.trim());
    }
    const { data } = await api.post<DocumentDto>("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /** List documents for a project */
  async listByProject(projectName: string): Promise<DocumentDto[]> {
    const { data } = await api.get<DocumentDto[]>("/documents", {
      params: { projectName },
    });
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
};
