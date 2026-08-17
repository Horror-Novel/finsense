import axios from "axios";

// In Next.js, VITE_* env vars don't exist — use NEXT_PUBLIC_* instead.
// In dev, Next.js proxies /api to the backend via next.config.js rewrites,
// so we don't need an absolute URL at all. In production, same proxy via nginx.
const baseURL = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE)
  ? process.env.NEXT_PUBLIC_API_BASE + "/api"
  : "/api";

const api = axios.create({ baseURL });

// Attach JWT to every outgoing request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("finsense_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("finsense_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
