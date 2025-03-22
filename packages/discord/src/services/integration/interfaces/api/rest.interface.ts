import { ApiResponse } from '../../../../types/api';

export interface RestConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface RestClient {
  get<T>(path: string): Promise<ApiResponse<T>>;
  post<T>(path: string, data: unknown): Promise<ApiResponse<T>>;
  put<T>(path: string, data: unknown): Promise<ApiResponse<T>>;
  delete<T>(path: string): Promise<ApiResponse<T>>;
  setHeader(key: string, value: string): void;
  setTimeout(timeout: number): void;
}

export interface RestError extends Error {
  status?: number;
  data?: unknown;
}