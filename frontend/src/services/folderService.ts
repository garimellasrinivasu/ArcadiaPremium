import api from "./api";

export interface FolderDto {
  id: number;
  projectName: string;
  name: string;
  parentId: number | null;
  createdBy: string;
  createdAt: string;
  children: FolderDto[];
}

export const folderService = {
  /** Get the full folder tree for a project */
  async getTree(projectName: string): Promise<FolderDto[]> {
    const { data } = await api.get<FolderDto[]>("/document-folders/tree", {
      params: { projectName },
    });
    return data;
  },

  /** Create a new folder */
  async create(
    projectName: string,
    name: string,
    parentId: number | null
  ): Promise<FolderDto> {
    const { data } = await api.post<FolderDto>("/document-folders", {
      projectName,
      name,
      parentId,
    });
    return data;
  },

  /** Rename a folder */
  async rename(id: number, name: string): Promise<FolderDto> {
    const { data } = await api.put<FolderDto>(`/document-folders/${id}`, {
      name,
    });
    return data;
  },

  /** Delete a folder (admin only) */
  async delete(id: number): Promise<void> {
    await api.delete(`/document-folders/${id}`);
  },

  /** Get breadcrumb path */
  async getBreadcrumb(id: number): Promise<FolderDto[]> {
    const { data } = await api.get<FolderDto[]>(
      `/document-folders/${id}/breadcrumb`
    );
    return data;
  },
};
