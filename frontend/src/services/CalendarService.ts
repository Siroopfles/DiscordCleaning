import { CalendarEvent, CreateCalendarEventDTO, UpdateCalendarEventDTO } from '@/types/calendar';
import { GoogleCalendarRepository } from '@/repositories/GoogleCalendarRepository';

export class CalendarService {
  private repository: GoogleCalendarRepository;

  constructor() {
    this.repository = new GoogleCalendarRepository();
  }

  /**
   * List events within a specified time range
   */
  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();
      
      const events = await this.repository.listEvents(timeMin, timeMax);
      return events.filter(event => event.status !== 'cancelled');
    } catch (error) {
      console.error('Failed to list calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  /**
   * Get a specific event by ID
   */
  async getEvent(eventId: string): Promise<CalendarEvent> {
    try {
      return await this.repository.getEvent(eventId);
    } catch (error) {
      console.error(`Failed to get calendar event ${eventId}:`, error);
      throw new Error('Failed to fetch calendar event');
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(eventData: CreateCalendarEventDTO): Promise<CalendarEvent> {
    try {
      // Validate event data
      if (!this.validateEventTimes(eventData.start.dateTime, eventData.end.dateTime)) {
        throw new Error('Invalid event times: end time must be after start time');
      }

      return await this.repository.createEvent(eventData);
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventData: UpdateCalendarEventDTO): Promise<CalendarEvent> {
    try {
      // If updating times, validate them
      if (eventData.start?.dateTime && eventData.end?.dateTime) {
        if (!this.validateEventTimes(eventData.start.dateTime, eventData.end.dateTime)) {
          throw new Error('Invalid event times: end time must be after start time');
        }
      }

      return await this.repository.updateEvent(eventData);
    } catch (error) {
      console.error(`Failed to update calendar event ${eventData.id}:`, error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.repository.deleteEvent(eventId);
    } catch (error) {
      console.error(`Failed to delete calendar event ${eventId}:`, error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Validate that event end time is after start time
   */
  private validateEventTimes(startTime: string, endTime: string): boolean {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return end > start;
  }
}

// Export singleton instance
export const calendarService = new CalendarService();