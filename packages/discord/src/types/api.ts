// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Task types
export interface TaskCreate {
  title: string;
  description?: string;
  categoryId?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  assigned_to?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface CategoryCreate {
  name: string;
  color: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// API Service interface
export interface ApiService {
  // Task endpoints
  createTask(data: TaskCreate): Promise<ApiResponse<Task>>;
  getTasks(): Promise<ApiResponse<Task[]>>;
  updateTask(taskId: string, data: TaskUpdate): Promise<ApiResponse<Task>>;
  deleteTask(taskId: string): Promise<ApiResponse<void>>;

  // Category endpoints
  getCategories(): Promise<ApiResponse<CategoryInfo[]>>;
  getCategory(categoryId: string): Promise<ApiResponse<CategoryInfo>>;
  createCategory(data: CategoryCreate): Promise<ApiResponse<CategoryInfo>>;
  updateCategory(categoryId: string, data: CategoryCreate): Promise<ApiResponse<CategoryInfo>>;
  deleteCategory(categoryId: string): Promise<ApiResponse<void>>;

  // Currency endpoints
  getBalance(userId: string, serverId: string): Promise<ApiResponse<CurrencyBalance>>;
  addReward(userId: string, serverId: string, data: CurrencyReward): Promise<ApiResponse<CurrencyBalance>>;
  transferCurrency(fromUserId: string, toUserId: string, serverId: string, data: CurrencyTransfer): Promise<ApiResponse<CurrencyTransferResult>>;
  getTransactionHistory(userId: string, serverId: string, page?: number, limit?: number): Promise<ApiResponse<TransactionHistoryResult>>;
  getLeaderboard(serverId: string, limit?: number): Promise<ApiResponse<CurrencyBalance[]>>;
  getUserStatistics(userId: string, serverId: string): Promise<ApiResponse<CurrencyStatistics>>;
}

// Currency types
export interface CurrencyBalance {
  userId: string;
  serverId: string;
  balance: number;
}

export interface CurrencyReward {
  amount: number;
  description: string;
  taskId?: string;
}

export interface CurrencyTransfer {
  amount: number;
  description: string;
}

export interface CurrencyTransferResult {
  fromBalance: CurrencyBalance;
  toBalance: CurrencyBalance;
}

export interface Transaction {
  userId: string;
  serverId: string;
  amount: number;
  type: 'REWARD' | 'DEDUCTION' | 'TRANSFER';
  description: string;
  relatedUserId?: string;
  relatedTaskId?: string;
  createdAt: string;
}

export interface TransactionHistoryResult {
  transactions: Transaction[];
  hasMore: boolean;
}

export interface CurrencyStatistics {
  statistics: {
    reward?: {
      total: number;
      count: number;
    };
    transfer?: {
      total: number;
      count: number;
    };
  };
}