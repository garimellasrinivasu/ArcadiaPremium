import api from "./api";

export interface FolderPermissionDto {
  id: number;
  folderId: number;
  folderName: string;
  userEmail: string;
  userName: string;
  permissionLevel: "VIEW" | "UPLOAD" | "DELETE" | "MANAGE";
  grantedBy: string;
  grantedAt: string;
}

export interface SimpleUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export const folderPermissionService = {
  /** Get all permissions for a folder */
  async getPermissions(folderId: number): Promise<FolderPermissionDto[]> {
    const { data } = await api.get<FolderPermissionDto[]>(
      `/folder-permissions/${folderId}`
    );
    return data;
  },

  /** Set (create or update) a permission */
  async setPermission(
    folderId: number,
    userEmail: string,
    permissionLevel: string
  ): Promise<FolderPermissionDto> {
    const { data } = await api.post<FolderPermissionDto>(
      "/folder-permissions",
      { folderId, userEmail, permissionLevel }
    );
    return data;
  },

  /** Remove a permission */
  async removePermission(
    folderId: number,
    userEmail: string
  ): Promise<void> {
    await api.delete(`/folder-permissions/${folderId}/${userEmail}`);
  },

  /** Get simple user list for the permission picker */
  async getSimpleUserList(): Promise<SimpleUser[]> {
    const { data } = await api.get<SimpleUser[]>("/users/simple");
    return data;
  },
};
