import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { api } from '../../services/api';

export interface AnalyticsMetrics {
  totalTasks: number;
  completedTasks: number;
  averageCompletionTime: number;
  tasksByCategory: Array<{
    categoryId: string;
    count: number;
    completedCount: number;
  }>;
  tasksByUser: Array<{
    userId: string;
    count: number;
    completedCount: number;
    averageCompletionTime: number;
  }>;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface AnalyticsData {
  serverId: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  date: string;
  metrics: AnalyticsMetrics;
}

interface AnalyticsState {
  data: AnalyticsData[];
  trends: Record<string, Array<{ date: string; value: number }>>;
  comparisons: {
    current: Record<string, number>;
    previous: Record<string, number>;
    changes: Record<string, number>;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: [],
  trends: {},
  comparisons: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async ({ 
    serverId, 
    timeframe, 
    startDate, 
    endDate 
  }: { 
    serverId: string;
    timeframe: 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
  }) => {
    try {
      const response = await api.get(`/analytics/${serverId}`, {
        params: {
          timeframe,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const fetchMetricTrends = createAsyncThunk(
  'analytics/fetchMetricTrends',
  async ({ 
    serverId, 
    timeframe, 
    metrics,
    startDate,
    endDate,
    limit
  }: {
    serverId: string;
    timeframe: 'daily' | 'weekly' | 'monthly';
    metrics: string[];
    startDate: Date;
    endDate: Date;
    limit?: number;
  }) => {
    try {
      const response = await api.get(`/analytics/${serverId}/trends`, {
        params: {
          timeframe,
          metrics: metrics.join(','),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const fetchComparativeStats = createAsyncThunk(
  'analytics/fetchComparativeStats',
  async ({ 
    serverId, 
    timeframe,
    currentPeriodStart,
    metrics
  }: {
    serverId: string;
    timeframe: 'daily' | 'weekly' | 'monthly';
    currentPeriodStart: Date;
    metrics: string[];
  }) => {
    try {
      const response = await api.get(`/analytics/${serverId}/compare`, {
        params: {
          timeframe,
          currentPeriodStart: currentPeriodStart.toISOString(),
          metrics: metrics.join(','),
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.data = [];
      state.trends = {};
      state.comparisons = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAnalytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action: PayloadAction<AnalyticsData[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as AxiosError)?.message || 'Er is een fout opgetreden';
      })
      // fetchMetricTrends
      .addCase(fetchMetricTrends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetricTrends.fulfilled, (state, action) => {
        state.loading = false;
        state.trends = action.payload;
      })
      .addCase(fetchMetricTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as AxiosError)?.message || 'Er is een fout opgetreden';
      })
      // fetchComparativeStats
      .addCase(fetchComparativeStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComparativeStats.fulfilled, (state, action) => {
        state.loading = false;
        state.comparisons = action.payload;
      })
      .addCase(fetchComparativeStats.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as AxiosError)?.message || 'Er is een fout opgetreden';
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;

export default analyticsSlice.reducer;