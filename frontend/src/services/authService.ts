import api from "./api";
import type { LoginRequest, LoginResponse, User } from "../types/user";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("refreshToken", data.refreshToken);
    if (data.mustChangePassword) {
      sessionStorage.setItem("mustChangePassword", "true");
    } else {
      sessionStorage.removeItem("mustChangePassword");
    }
    return data;
  },

  logout(): void {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("mustChangePassword");
    window.location.href = "/login";
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem("token");
  },

  mustChangePassword(): boolean {
    return sessionStorage.getItem("mustChangePassword") === "true";
  },

  clearMustChangePassword(): void {
    sessionStorage.removeItem("mustChangePassword");
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("/auth/forgot-password", { email });
    return data;
  },
};
