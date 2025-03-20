import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

// Request interceptor voor auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor voor error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error?.response?.data || error);
  }
);

// Currency API endpoints
export const currencyApi = {
  getBalance: () => api.get<ApiResponse<{ balance: number }>>('/currency/balance'),
  
  getTransactions: (page: number = 1) => 
    api.get<ApiResponse<{ transactions: any[]; hasMore: boolean }>>(
      `/currency/transactions?page=${page}`
    ),
  
  transfer: (data: { toUserId: string; amount: number; description?: string }) =>
    api.post<ApiResponse>('/currency/transfer', data),
  
  getLeaderboard: (limit: number = 10) =>
    api.get<ApiResponse<any[]>>(`/currency/leaderboard?limit=${limit}`)
};