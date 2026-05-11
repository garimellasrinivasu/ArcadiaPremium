import api from "./api";
import type { User, CreateUserRequest, UpdateUserRequest, Role, Permission } from "../types/user";

export const userService = {
  async getAll(): Promise<User[]> {
    const { data } = await api.get<User[]>("/users");
    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  async create(user: CreateUserRequest): Promise<User> {
    const { data } = await api.post<User>("/users", user);
    return data;
  },

  async update(id: number, user: UpdateUserRequest): Promise<User> {
    const { data } = await api.put<User>(`/users/${id}`, user);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getAllRoles(): Promise<Role[]> {
    const { data } = await api.get<Role[]>("/roles");
    return data;
  },

  async getAllPermissions(): Promise<Permission[]> {
    const { data } = await api.get<Permission[]>("/roles/permissions");
    return data;
  },

  async createRole(name: string, description: string, permissionIds: number[]): Promise<Role> {
    const { data } = await api.post<Role>("/roles", { name, description, permissionIds });
    return data;
  },

  async updateRole(id: number, name: string, description: string, permissionIds: number[]): Promise<Role> {
    const { data } = await api.put<Role>(`/roles/${id}`, { name, description, permissionIds });
    return data;
  },

  async deleteRole(id: number): Promise<void> {
    await api.delete(`/roles/${id}`);
  },
};
