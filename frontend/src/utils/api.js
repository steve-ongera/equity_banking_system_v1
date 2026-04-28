import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        orig.headers.Authorization = `Bearer ${data.access}`;
        return api(orig);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/auth/login/', { username, password });

export const register = (payload) =>
  api.post('/auth/register/', payload);

// ─── Dashboard ─────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard/');

// ─── Accounts ──────────────────────────────────────────────────────────────
export const getAccounts = () => api.get('/accounts/');
export const getAccount  = (id) => api.get(`/accounts/${id}/`);

// ─── Transactions ──────────────────────────────────────────────────────────
export const getTransactions = (params = {}) =>
  api.get('/transactions/', { params });

// ─── Operations ────────────────────────────────────────────────────────────
export const deposit  = (payload) => api.post('/deposit/',  payload);
export const withdraw = (payload) => api.post('/withdraw/', payload);
export const transfer = (payload) => api.post('/transfer/', payload);

// ─── Notifications ─────────────────────────────────────────────────────────
export const getNotifications  = () => api.get('/notifications/');
export const markAllRead       = () => api.delete('/notifications/1/');
export const markRead          = (id) => api.post(`/notifications/${id}/`);

// ─── Fees ──────────────────────────────────────────────────────────────────
export const getFees = () => api.get('/fees/');

// ─── Me ────────────────────────────────────────────────────────────────────
export const getMe        = () => api.get('/me/');
export const updateMe     = (payload) => api.patch('/me/', payload);

export default api;