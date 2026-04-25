import api from "./api";
import type { User, CreateUserRequest, UpdateUserRequest, Role } from "../types/user";

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
};
