import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GoogleCalendarRepository } from '@/repositories/GoogleCalendarRepository';
import { CalendarEvent, CreateCalendarEventDTO, UpdateCalendarEventDTO } from '@/types/calendar';

interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  permission: {
    granted: boolean;
    loading: boolean;
    error: string | null;
  };
}

const initialState: CalendarState = {
  events: [],
  loading: false,
  syncing: false,
  error: null,
  permission: {
    granted: false,
    loading: false,
    error: null
  }
};

const calendarRepo = new GoogleCalendarRepository();

// Thunks
export const fetchEvents = createAsyncThunk(
  'calendar/fetchEvents',
  async ({ timeMin, timeMax }: { timeMin: string; timeMax: string }) => {
    return await calendarRepo.listEvents(timeMin, timeMax);
  }
);

export const createEvent = createAsyncThunk(
  'calendar/createEvent',
  async (eventData: CreateCalendarEventDTO, { rejectWithValue }) => {
    try {
      return await calendarRepo.createEvent(eventData);
    } catch (error) {
      return rejectWithValue('Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'calendar/updateEvent',
  async (eventData: UpdateCalendarEventDTO, { rejectWithValue }) => {
    try {
      return await calendarRepo.updateEvent(eventData);
    } catch (error) {
      return rejectWithValue('Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'calendar/deleteEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await calendarRepo.deleteEvent(eventId);
      return eventId;
    } catch (error) {
      return rejectWithValue('Failed to delete event');
    }
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setSyncStatus(state, action: PayloadAction<boolean>) {
      state.syncing = action.payload;
    },
    setPermissionStatus(state, action: PayloadAction<boolean>) {
      state.permission.granted = action.payload;
      state.permission.error = null;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch events
    builder.addCase(fetchEvents.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEvents.fulfilled, (state, action) => {
      state.loading = false;
      state.events = action.payload;
    });
    builder.addCase(fetchEvents.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? 'Failed to fetch events';
    });

    // Create event
    builder.addCase(createEvent.pending, (state) => {
      state.syncing = true;
    });
    builder.addCase(createEvent.fulfilled, (state, action) => {
      state.syncing = false;
      state.events.push(action.payload);
    });
    builder.addCase(createEvent.rejected, (state, action) => {
      state.syncing = false;
      state.error = action.payload as string;
    });

    // Update event
    builder.addCase(updateEvent.pending, (state) => {
      state.syncing = true;
    });
    builder.addCase(updateEvent.fulfilled, (state, action) => {
      state.syncing = false;
      const index = state.events.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    });
    builder.addCase(updateEvent.rejected, (state, action) => {
      state.syncing = false;
      state.error = action.payload as string;
    });

    // Delete event
    builder.addCase(deleteEvent.pending, (state) => {
      state.syncing = true;
    });
    builder.addCase(deleteEvent.fulfilled, (state, action) => {
      state.syncing = false;
      state.events = state.events.filter(e => e.id !== action.payload);
    });
    builder.addCase(deleteEvent.rejected, (state, action) => {
      state.syncing = false;
      state.error = action.payload as string;
    });
  }
});

export const { setSyncStatus, setPermissionStatus, clearError } = calendarSlice.actions;
export default calendarSlice.reducer;