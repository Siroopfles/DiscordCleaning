import { configureStore } from '@reduxjs/toolkit';
import calendarReducer from './slices/calendarSlice';
import analyticsReducer from './slices/analyticsSlice';
import taskHistoryReducer from './slices/taskHistorySlice';

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
    analytics: analyticsReducer,
    taskHistory: taskHistoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;