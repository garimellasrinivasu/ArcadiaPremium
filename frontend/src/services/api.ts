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
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
