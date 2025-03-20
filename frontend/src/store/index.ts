import { configureStore } from '@reduxjs/toolkit';
import achievementsReducer from './slices/achievementsSlice';

export const store = configureStore({
  reducer: {
    achievements: achievementsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;