import type { Event } from 'react-big-calendar';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
  updated: string;
}

export interface CreateCalendarEventDTO {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export interface UpdateCalendarEventDTO extends Partial<CreateCalendarEventDTO> {
  id: string;
}

export interface CalendarRepository {
  listEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]>;
  getEvent(eventId: string): Promise<CalendarEvent>;
  createEvent(event: CreateCalendarEventDTO): Promise<CalendarEvent>;
  updateEvent(event: UpdateCalendarEventDTO): Promise<CalendarEvent>;
  deleteEvent(eventId: string): Promise<void>;
}

// Extended types for react-big-calendar integration
export interface CalendarViewEvent extends Omit<Event, 'title'> {
  id: string;
  title: string; // Maps to summary
  summary: string;
  description?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  allDay?: boolean;
  start: Date;
  end: Date;
}

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

export interface ViewStateOptions {
  view: CalendarViewType;
  date: Date;
  start: Date;
  end: Date;
}