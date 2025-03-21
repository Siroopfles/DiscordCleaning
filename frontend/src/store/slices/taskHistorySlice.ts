import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { api } from '../../services/api';

export interface TaskHistoryItem {
  taskId: string;
  userId: string;
  serverId: string;
  action: 'created' | 'updated' | 'completed' | 'deleted';
  timestamp: string;
  previousState?: any;
  newState?: any;
  metadata?: {
    completionTime?: number;
    categoryId?: string;
    priority?: string;
    assignedTo?: string;
  };
}

interface TaskHistoryState {
  items: TaskHistoryItem[];
  loading: boolean;
  error: string | null;
  filters: {
    dateRange?: { start: string; end: string };
    users?: string[];
    categories?: string[];
    actions?: ('created' | 'updated' | 'completed' | 'deleted')[];
  };
}

const initialState: TaskHistoryState = {
  items: [],
  loading: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchTaskHistory = createAsyncThunk(
  'taskHistory/fetchHistory',
  async ({ 
    serverId,
    startDate,
    endDate,
    filters
  }: { 
    serverId: string;
    startDate: Date;
    endDate: Date;
    filters?: {
      users?: string[];
      categories?: string[];
      actions?: string[];
    };
  }) => {
    try {
      const response = await api.get(`/history/${serverId}`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

const taskHistorySlice = createSlice({
  name: 'taskHistory',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<TaskHistoryState['filters']>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearHistory: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaskHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskHistory.fulfilled, (state, action: PayloadAction<TaskHistoryItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTaskHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as AxiosError)?.message || 'Er is een fout opgetreden';
      });
  },
});

export const { setFilters, clearFilters, clearHistory } = taskHistorySlice.actions;

// Selectors
export const selectFilteredHistory = (state: { taskHistory: TaskHistoryState }) => {
  const { items, filters } = state.taskHistory;
  
  return items.filter(item => {
    if (filters.dateRange) {
      const itemDate = new Date(item.timestamp);
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      if (itemDate < start || itemDate > end) return false;
    }
    
    if (filters.users?.length && !filters.users.includes(item.userId)) {
      return false;
    }
    
    if (filters.categories?.length && !filters.categories.includes(item.metadata?.categoryId || '')) {
      return false;
    }
    
    if (filters.actions?.length && !filters.actions.includes(item.action)) {
      return false;
    }
    
    return true;
  });
};

export default taskHistorySlice.reducer;