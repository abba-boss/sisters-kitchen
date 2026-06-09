import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 / refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setAuth, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = data.data;
          setAuth(useAuthStore.getState().user, accessToken, newRefresh);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
