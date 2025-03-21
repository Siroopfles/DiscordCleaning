import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

import { CategoryInfo, UpdateCategoryDto } from '../../types/models';

// Types voor API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TaskCreate {
  title: string;
  description?: string;
  categoryId?: string;
}

interface TaskUpdate {
  title?: string;
  description?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  assigned_to?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryCreate {
  name: string;
  color: string;
}

// We gebruiken CategoryInfo van models.ts die extends van ICategory

export class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Response interceptor voor error handling
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        logger.error('API Error:', {
          status: error.response?.status,
          message: error.message,
          path: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Task endpoints
  async createTask(data: TaskCreate): Promise<ApiResponse<Task>> {
    try {
      const response = await this.client.post<ApiResponse<Task>>('/tasks', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTasks(): Promise<ApiResponse<Task[]>> {
    try {
      const response = await this.client.get<ApiResponse<Task[]>>('/tasks');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTask(taskId: string, data: TaskUpdate): Promise<ApiResponse<Task>> {
    try {
      const response = await this.client.patch<ApiResponse<Task>>(`/tasks/${taskId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Category endpoints
  async getCategories(): Promise<ApiResponse<CategoryInfo[]>> {
    try {
      const response = await this.client.get<ApiResponse<CategoryInfo[]>>('/categories');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCategory(categoryId: string): Promise<ApiResponse<CategoryInfo>> {
    try {
      const response = await this.client.get<ApiResponse<CategoryInfo>>(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCategory(data: CategoryCreate): Promise<ApiResponse<CategoryInfo>> {
    try {
      const response = await this.client.post<ApiResponse<CategoryInfo>>('/categories', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCategory(categoryId: string, data: UpdateCategoryDto): Promise<ApiResponse<CategoryInfo>> {
    try {
      const response = await this.client.patch<ApiResponse<CategoryInfo>>(`/categories/${categoryId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;

      switch (status) {
        case 404:
          return new Error('Resource niet gevonden');
        case 400:
          return new Error(`Ongeldige aanvraag: ${message}`);
        case 429:
          return new Error('Te veel verzoeken. Probeer het later opnieuw');
        case 500:
          return new Error('Interne serverfout');
        default:
          return new Error(`API fout: ${message}`);
      }
    }
    return new Error('Er is een onverwachte fout opgetreden');
  }
}