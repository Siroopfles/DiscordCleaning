import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo, CalendarProps } from 'react-big-calendar';
import { format, parse as dateFnsParse, startOfWeek, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '@/store/slices/calendarSlice';
import { CalendarEvent, CalendarViewEvent } from '@/types/calendar';
import { SyncIndicator } from './SyncIndicator';
import { EventEditorModal } from './EventEditorModal';
import { PermissionManager } from './PermissionManager';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'nl': nl,
};

// Wrapper function to match react-big-calendar's expected signature
const parse = (dateString: string, format: string, options?: { locale?: any }) => {
  return dateFnsParse(dateString, format, new Date(), { locale: options?.locale });
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const convertToViewEvent = (event: CalendarEvent): CalendarViewEvent => ({
  id: event.id,
  title: event.summary,
  start: new Date(event.start.dateTime),
  end: new Date(event.end.dateTime),
  summary: event.summary,
  description: event.description,
  status: event.status,
});

interface CalendarViewProps {
  className?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const { events, loading } = useAppSelector((state: { calendar: { events: CalendarEvent[]; loading: boolean } }) => ({
    events: state.calendar.events,
    loading: state.calendar.loading,
  }));

  const viewEvents = useMemo(() => 
    events.map(convertToViewEvent),
    [events]
  );

  const handleRangeChange = useCallback((range: Date[] | { start: Date; end: Date }) => {
    if (hasPermission) {
      const { start, end } = Array.isArray(range) 
        ? { start: range[0], end: range[range.length - 1] }
        : range;

      dispatch(fetchEvents({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
      }));
    }
  }, [dispatch, hasPermission]);

  const handleSelectEvent = useCallback((event: CalendarViewEvent) => {
    const originalEvent = events.find(e => e.id === event.id);
    if (originalEvent) {
      setSelectedEvent(originalEvent);
      setIsModalOpen(true);
    }
  }, [events]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo.start);
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) {
      await dispatch(deleteEvent(eventId));
    }
  }, [dispatch]);

  const handlePermissionChange = useCallback((granted: boolean) => {
    setHasPermission(granted);
    if (granted) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      dispatch(fetchEvents({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
      }));
    }
  }, [dispatch]);

  useEffect(() => {
    if (hasPermission) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      dispatch(fetchEvents({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
      }));
    }
  }, [dispatch, hasPermission]);

  // Define calendar props with proper typing
  const calendarProps: CalendarProps<CalendarViewEvent> = {
    localizer,
    events: viewEvents,
    startAccessor: "start",
    endAccessor: "end",
    style: { height: 'calc(100vh - 200px)' },
    onRangeChange: handleRangeChange,
    onSelectEvent: handleSelectEvent,
    onSelectSlot: handleSelectSlot,
    selectable: hasPermission,
    defaultView: "month",
    views: ['month', 'week', 'day', 'agenda'],
    popup: true,
    className: loading ? 'opacity-50' : '',
    messages: {
      today: 'Vandaag',
      previous: 'Vorige',
      next: 'Volgende',
      month: 'Maand',
      week: 'Week',
      day: 'Dag',
      agenda: 'Agenda',
      showMore: (total: number) => `+${total} meer`,
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Agenda</h2>
        <div className="flex items-center space-x-4">
          <SyncIndicator />
          <PermissionManager onPermissionChange={handlePermissionChange} />
        </div>
      </div>
      
      <div className={className}>
        <Calendar<CalendarViewEvent> {...calendarProps} />
      </div>

      <EventEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setSelectedSlot(null);
        }}
        event={selectedEvent ?? undefined}
        defaultDate={selectedSlot ?? undefined}
      />
    </div>
  );
};