import api from "./api";
import type { LoginRequest, LoginResponse, User } from "../types/user";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("refreshToken", data.refreshToken);
    return data;
  },

  logout(): void {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    window.location.href = "/login";
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem("token");
  },
};
