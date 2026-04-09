import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your Railway deployment URL for production
// For local development, use your machine's LAN IP (not localhost)
// e.g., 'http://192.168.1.100:8000/api'
const API_BASE_URL = 'https://web-production-15a68.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Event emitter for auth state changes (logout on token failure)
type AuthListener = () => void;
let onAuthFailure: AuthListener | null = null;

export function setAuthFailureListener(listener: AuthListener) {
  onAuthFailure = listener;
}

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = await SecureStore.getItemAsync('refresh');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh });
          await SecureStore.setItemAsync('access', data.access);
          if (data.refresh) {
            await SecureStore.setItemAsync('refresh', data.refresh);
          }
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          await SecureStore.deleteItemAsync('access');
          await SecureStore.deleteItemAsync('refresh');
          onAuthFailure?.();
        }
      } else {
        onAuthFailure?.();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
