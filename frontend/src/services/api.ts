import axios from "axios";

// Always use relative /api path.
// CORS is avoided entirely because every environment proxies /api:
//   - Dev server (npm run dev): Vite proxy → localhost:8080
//   - Local preview (npm run preview): Vite proxy → Render
//   - Netlify (production): Netlify proxy → Render
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Log if token is missing but we're trying to make an authenticated request
    if (!config.url?.includes("/auth/login")) {
      console.warn("Auth token missing for request:", config.url);
    }
  }
  return config;
});

// Handle 401/403 -> redirect to login or show error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("Auth error:", error.response.status, error.config.url);
      // Only clear and redirect if it's a 401 (Unauthorized)
      if (error.response.status === 401) {
        sessionStorage.removeItem("token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

