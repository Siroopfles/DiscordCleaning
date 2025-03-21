import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { CalendarEvent, CreateCalendarEventDTO, UpdateCalendarEventDTO } from './types';

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleCalendarClient {
  private calendar: calendar_v3.Calendar;
  private auth: OAuth2Client;

  constructor(config: GoogleCalendarConfig) {
    this.auth = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  setAccessToken(token: string): void {
    this.auth.setCredentials({ access_token: token });
  }

  async listEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items?.map(this.mapToCalendarEvent) || [];
  }

  async getEvent(eventId: string): Promise<CalendarEvent> {
    const response = await this.calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    return this.mapToCalendarEvent(response.data);
  }

  async createEvent(data: CreateCalendarEventDTO): Promise<CalendarEvent> {
    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: data.summary,
        description: data.description || undefined,
        start: data.start,
        end: data.end,
      },
    });

    return this.mapToCalendarEvent(response.data);
  }

  async updateEvent(data: UpdateCalendarEventDTO): Promise<CalendarEvent> {
    const response = await this.calendar.events.update({
      calendarId: 'primary',
      eventId: data.id,
      requestBody: {
        summary: data.summary || undefined,
        description: data.description || undefined,
        start: data.start,
        end: data.end,
      },
    });

    return this.mapToCalendarEvent(response.data);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }

  private mapToCalendarEvent(event: calendar_v3.Schema$Event): CalendarEvent {
    if (!event.id || !event.start || !event.end) {
      throw new Error('Invalid event data received from Google Calendar API');
    }

    return {
      id: event.id,
      summary: event.summary || '',
      description: event.description || undefined,
      start: {
        dateTime: event.start.dateTime || event.start.date || '',
        timeZone: event.start.timeZone || 'UTC',
      },
      end: {
        dateTime: event.end.dateTime || event.end.date || '',
        timeZone: event.end.timeZone || 'UTC',
      },
      status: (event.status as CalendarEvent['status']) || 'confirmed',
      created: event.created || new Date().toISOString(),
      updated: event.updated || new Date().toISOString(),
    };
  }
}