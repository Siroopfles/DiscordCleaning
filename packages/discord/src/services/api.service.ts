import axios, { AxiosInstance } from 'axios';
import {
  ApiService,
  CurrencyReward,
  CurrencyTransfer
} from '../types/api';
import { DiscordClient } from '../types';
import { BaseService } from './base.service';

export class DefaultApiService extends BaseService implements ApiService {
  private axiosClient!: AxiosInstance;

  constructor(client: DiscordClient) {
    super(client);
    const baseURL = client.config.apiBaseUrl;
    if (!baseURL) {
      throw new Error('API base URL is required');
    }
  }

  protected async initialize(): Promise<void> {
    this.axiosClient = axios.create({
      baseURL: this.client.config.apiBaseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor voor logging
    this.axiosClient.interceptors.request.use(
      (config) => {
        this.log('debug', 'API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
          params: config.params
        });
        return config;
      },
      (error) => {
        this.log('error', 'API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor voor logging en error handling
    this.axiosClient.interceptors.response.use(
      (response) => {
        this.log('debug', 'API Response:', {
          status: response.status,
          data: response.data,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        const errorDetails = {
          status: error.response?.status,
          message: error.message,
          path: error.config?.url,
          data: error.response?.data,
          timestamp: new Date().toISOString()
        };

        this.log('error', 'API Error:', errorDetails);

        // Log rate limit specifieke informatie
        if (error.response?.status === 429) {
          this.log('warn', 'Rate Limit Hit:', {
            ...errorDetails,
            retryAfter: error.response.headers['retry-after']
          });
        }

        return Promise.reject(error);
      }
    );
  }

  // Helper method voor het loggen van currency operaties
  private logCurrencyOperation(operation: string, details: any) {
    this.log('info', `Currency Operation: ${operation}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
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

  async createTask(data: any) {
    try {
      const response = await this.axiosClient.post('/tasks', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTasks() {
    try {
      const response = await this.axiosClient.get('/tasks');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTask(taskId: string, data: any) {
    try {
      const response = await this.axiosClient.patch(`/tasks/${taskId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteTask(taskId: string) {
    try {
      const response = await this.axiosClient.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCategories() {
    try {
      const response = await this.axiosClient.get('/categories');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCategory(categoryId: string) {
    try {
      const response = await this.axiosClient.get(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCategory(data: any) {
    try {
      const response = await this.axiosClient.post('/categories', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCategory(categoryId: string, data: any) {
    try {
      const response = await this.axiosClient.patch(`/categories/${categoryId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCategory(categoryId: string) {
    try {
      const response = await this.axiosClient.delete(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Currency endpoints
  async getBalance(userId: string, serverId: string) {
    try {
      const response = await this.axiosClient.get(`/currency/${userId}/balance?serverId=${serverId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addReward(userId: string, serverId: string, data: CurrencyReward) {
    try {
      this.logCurrencyOperation('REWARD', {
        userId,
        serverId,
        amount: data.amount,
        description: data.description
      });

      const response = await this.axiosClient.post(`/currency/${userId}/reward?serverId=${serverId}`, data);
      
      if (response.data.success) {
        this.logCurrencyOperation('REWARD_SUCCESS', {
          userId,
          serverId,
          amount: data.amount,
          newBalance: response.data.data?.balance
        });
      }

      return response.data;
    } catch (error) {
      this.logCurrencyOperation('REWARD_ERROR', {
        userId,
        serverId,
        amount: data.amount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw this.handleError(error);
    }
  }

  async transferCurrency(fromUserId: string, toUserId: string, serverId: string, data: CurrencyTransfer) {
    try {
      this.logCurrencyOperation('TRANSFER', {
        fromUserId,
        toUserId,
        serverId,
        amount: data.amount,
        description: data.description
      });

      const response = await this.axiosClient.post(
        `/currency/${fromUserId}/transfer/${toUserId}?serverId=${serverId}`,
        data
      );
      
      if (response.data.success) {
        this.logCurrencyOperation('TRANSFER_SUCCESS', {
          fromUserId,
          toUserId,
          serverId,
          amount: data.amount,
          fromBalance: response.data.data?.fromBalance?.balance,
          toBalance: response.data.data?.toBalance?.balance
        });
      }

      return response.data;
    } catch (error) {
      this.logCurrencyOperation('TRANSFER_ERROR', {
        fromUserId,
        toUserId,
        serverId,
        amount: data.amount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw this.handleError(error);
    }
  }

  async getTransactionHistory(userId: string, serverId: string, page?: number, limit?: number) {
    try {
      const query = new URLSearchParams();
      query.append('serverId', serverId);
      if (page) query.append('page', page.toString());
      if (limit) query.append('limit', limit.toString());
      const response = await this.axiosClient.get(`/currency/${userId}/transactions?${query.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLeaderboard(serverId: string, limit?: number) {
    try {
      const query = new URLSearchParams();
      query.append('serverId', serverId);
      if (limit) query.append('limit', limit.toString());
      const response = await this.axiosClient.get(`/currency/leaderboard?${query.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserStatistics(userId: string, serverId: string) {
    try {
      const response = await this.axiosClient.get(`/currency/${userId}/statistics?serverId=${serverId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}