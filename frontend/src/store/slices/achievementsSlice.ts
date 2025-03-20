import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Achievement, AchievementProgress } from '@/types/achievement';
import { achievementService } from '@/services/achievementService';
import { AppDispatch } from '../index';

interface AchievementsState {
  achievements: Achievement[];
  progress: AchievementProgress[];
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
}

const initialState: AchievementsState = {
  achievements: [],
  progress: [],
  loading: false,
  error: null,
  selectedCategory: null,
};

const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setAchievements: (state, action: PayloadAction<Achievement[]>) => {
      state.achievements = action.payload;
    },
    setProgress: (state, action: PayloadAction<AchievementProgress[]>) => {
      state.progress = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    updateProgress: (state, action: PayloadAction<AchievementProgress>) => {
      const index = state.progress.findIndex(p => p.achievementId === action.payload.achievementId);
      if (index !== -1) {
        state.progress[index] = action.payload;
      } else {
        state.progress.push(action.payload);
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setAchievements,
  setProgress,
  updateProgress,
  setSelectedCategory
} = achievementsSlice.actions;

// Thunks
export const fetchAchievements = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const achievements = await achievementService.getAllAchievements();
    dispatch(setAchievements(achievements));
    dispatch(setError(null));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch achievements'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchUserProgress = (userId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const progress = await achievementService.getUserProgress(userId);
    dispatch(setProgress(progress));
    dispatch(setError(null));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch progress'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateUserProgress = (
  userId: string,
  achievementId: string,
  progress: Partial<AchievementProgress>
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const updatedProgress = await achievementService.updateProgress(userId, achievementId, progress);
    dispatch(updateProgress(updatedProgress));
    dispatch(setError(null));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to update progress'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default achievementsSlice.reducer;