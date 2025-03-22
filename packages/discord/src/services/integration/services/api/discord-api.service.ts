import { BaseService } from '../../../base.service';
import { DiscordClient } from '../../../../types';
import { 
  ApiService, 
  Task, 
  TaskCreate, 
  TaskUpdate,
  CategoryInfo,
  CategoryCreate,
  CurrencyBalance,
  CurrencyReward,
  CurrencyTransfer,
  CurrencyTransferResult,
  TransactionHistoryResult,
  CurrencyStatistics,
  ApiResponse
} from '../../../../types/api';
import { createBaseRestService } from './index';
import { RestService } from './rest.service';

export class DiscordApiService extends BaseService implements ApiService {
  private readonly rest: RestService;

  constructor(client: DiscordClient) {
    super(client);
    this.rest = createBaseRestService(client);
  }

  protected async initialize(): Promise<void> {
    this.log('info', 'Initializing Discord API service');
  }

  // Task endpoints
  async createTask(data: TaskCreate): Promise<ApiResponse<Task>> {
    return this.rest.post<Task>('/tasks', data);
  }

  async getTasks(): Promise<ApiResponse<Task[]>> {
    return this.rest.get<Task[]>('/tasks');
  }

  async updateTask(taskId: string, data: TaskUpdate): Promise<ApiResponse<Task>> {
    return this.rest.put<Task>(`/tasks/${taskId}`, data);
  }

  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    return this.rest.delete<void>(`/tasks/${taskId}`);
  }

  // Category endpoints
  async getCategories(): Promise<ApiResponse<CategoryInfo[]>> {
    return this.rest.get<CategoryInfo[]>('/categories');
  }

  async getCategory(categoryId: string): Promise<ApiResponse<CategoryInfo>> {
    return this.rest.get<CategoryInfo>(`/categories/${categoryId}`);
  }

  async createCategory(data: CategoryCreate): Promise<ApiResponse<CategoryInfo>> {
    return this.rest.post<CategoryInfo>('/categories', data);
  }

  async updateCategory(categoryId: string, data: CategoryCreate): Promise<ApiResponse<CategoryInfo>> {
    return this.rest.put<CategoryInfo>(`/categories/${categoryId}`, data);
  }

  async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    return this.rest.delete<void>(`/categories/${categoryId}`);
  }

  // Currency endpoints
  async getBalance(userId: string, serverId: string): Promise<ApiResponse<CurrencyBalance>> {
    return this.rest.get<CurrencyBalance>(`/currency/${userId}/balance?serverId=${serverId}`);
  }

  async addReward(
    userId: string, 
    serverId: string, 
    data: CurrencyReward
  ): Promise<ApiResponse<CurrencyBalance>> {
    return this.rest.post<CurrencyBalance>(
      `/currency/${userId}/reward?serverId=${serverId}`,
      data
    );
  }

  async transferCurrency(
    fromUserId: string,
    toUserId: string,
    serverId: string,
    data: CurrencyTransfer
  ): Promise<ApiResponse<CurrencyTransferResult>> {
    return this.rest.post<CurrencyTransferResult>(
      `/currency/${fromUserId}/transfer/${toUserId}?serverId=${serverId}`,
      data
    );
  }

  async getTransactionHistory(
    userId: string,
    serverId: string,
    page?: number,
    limit?: number
  ): Promise<ApiResponse<TransactionHistoryResult>> {
    const query = new URLSearchParams();
    query.append('serverId', serverId);
    if (page) query.append('page', page.toString());
    if (limit) query.append('limit', limit.toString());

    return this.rest.get<TransactionHistoryResult>(
      `/currency/${userId}/transactions?${query.toString()}`
    );
  }

  async getLeaderboard(
    serverId: string,
    limit?: number
  ): Promise<ApiResponse<CurrencyBalance[]>> {
    const query = new URLSearchParams();
    query.append('serverId', serverId);
    if (limit) query.append('limit', limit.toString());

    return this.rest.get<CurrencyBalance[]>(
      `/currency/leaderboard?${query.toString()}`
    );
  }

  async getUserStatistics(
    userId: string,
    serverId: string
  ): Promise<ApiResponse<CurrencyStatistics>> {
    return this.rest.get<CurrencyStatistics>(
      `/currency/${userId}/statistics?serverId=${serverId}`
    );
  }
}