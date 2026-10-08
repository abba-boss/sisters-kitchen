import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { errorMessages } from '../utils/toastConfig.jsx';

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

// Response interceptor – handle errors with user-friendly messages
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    // Handle 401 - Unauthorized / Token refresh
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
    
    // Enhance error with user-friendly message
    if (error.response) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message;
      
      // Map status codes to friendly messages
      switch (status) {
        case 400:
          error.userMessage = serverMessage || errorMessages.missingFields;
          break;
        case 401:
          error.userMessage = errorMessages.unauthorized;
          break;
        case 403:
          error.userMessage = errorMessages.forbidden;
          break;
        case 404:
          error.userMessage = errorMessages.notFound;
          break;
        case 500:
        case 502:
        case 503:
          error.userMessage = errorMessages.serverError;
          break;
        default:
          error.userMessage = serverMessage || errorMessages.somethingWentWrong;
      }
    } else if (error.request) {
      // Network error
      error.userMessage = errorMessages.network;
    } else {
      error.userMessage = errorMessages.somethingWentWrong;
    }
    
    return Promise.reject(error);
  }
);

export default api;
