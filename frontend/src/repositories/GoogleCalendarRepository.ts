import axios from 'axios';
import { CalendarEvent, CalendarRepository, CreateCalendarEventDTO, UpdateCalendarEventDTO } from '@/types/calendar';
import { getSession } from 'next-auth/react';

export class GoogleCalendarRepository implements CalendarRepository {
  private readonly baseUrl = 'https://www.googleapis.com/calendar/v3';
  private readonly calendarId = 'primary';

  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const session = await getSession();
    if (!session?.accessToken) {
      throw new Error('No access token available');
    }
    return { Authorization: `Bearer ${session.accessToken}` };
  }

  async listEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    const headers = await this.getAuthHeader();
    const response = await axios.get(`${this.baseUrl}/calendars/${this.calendarId}/events`, {
      headers,
      params: {
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      }
    });
    return response.data.items;
  }

  async getEvent(eventId: string): Promise<CalendarEvent> {
    const headers = await this.getAuthHeader();
    const response = await axios.get(
      `${this.baseUrl}/calendars/${this.calendarId}/events/${eventId}`,
      { headers }
    );
    return response.data;
  }

  async createEvent(event: CreateCalendarEventDTO): Promise<CalendarEvent> {
    const headers = await this.getAuthHeader();
    const response = await axios.post(
      `${this.baseUrl}/calendars/${this.calendarId}/events`,
      event,
      { headers }
    );
    return response.data;
  }

  async updateEvent(event: UpdateCalendarEventDTO): Promise<CalendarEvent> {
    const headers = await this.getAuthHeader();
    const { id, ...updateData } = event;
    const response = await axios.patch(
      `${this.baseUrl}/calendars/${this.calendarId}/events/${id}`,
      updateData,
      { headers }
    );
    return response.data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const headers = await this.getAuthHeader();
    await axios.delete(
      `${this.baseUrl}/calendars/${this.calendarId}/events/${eventId}`,
      { headers }
    );
  }
}