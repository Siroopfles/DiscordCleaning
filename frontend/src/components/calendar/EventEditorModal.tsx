import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useAppDispatch } from '@/store/hooks';
import { createEvent, updateEvent } from '@/store/slices/calendarSlice';
import { CalendarEvent, CreateCalendarEventDTO } from '@/types/calendar';
import { MdClose } from 'react-icons/md';

interface EventEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  defaultDate?: Date;
}

interface EventFormData {
  summary: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export const EventEditorModal: React.FC<EventEditorModalProps> = ({
  isOpen,
  onClose,
  event,
  defaultDate,
}) => {
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventFormData>();

  useEffect(() => {
    if (isOpen && event) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);

      reset({
        summary: event.summary,
        description: event.description || '',
        startDate: format(start, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endDate: format(end, 'yyyy-MM-dd'),
        endTime: format(end, 'HH:mm'),
      });
    } else if (isOpen && defaultDate) {
      reset({
        summary: '',
        description: '',
        startDate: format(defaultDate, 'yyyy-MM-dd'),
        startTime: format(defaultDate, 'HH:mm'),
        endDate: format(defaultDate, 'yyyy-MM-dd'),
        endTime: format(defaultDate.getHours() + 1, 'HH:mm'),
      });
    }
  }, [isOpen, event, defaultDate, reset]);

  const onSubmit = async (data: EventFormData) => {
    const eventData: CreateCalendarEventDTO = {
      summary: data.summary,
      description: data.description,
      start: {
        dateTime: `${data.startDate}T${data.startTime}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: `${data.endDate}T${data.endTime}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    if (event) {
      await dispatch(updateEvent({ id: event.id, ...eventData }));
    } else {
      await dispatch(createEvent(eventData));
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {event ? 'Bewerk Afspraak' : 'Nieuwe Afspraak'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
              Titel
            </label>
            <input
              type="text"
              id="summary"
              {...register('summary', { required: 'Titel is verplicht' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.summary && (
              <p className="mt-1 text-sm text-red-600">{errors.summary.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Beschrijving
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Datum
              </label>
              <input
                type="date"
                id="startDate"
                {...register('startDate', { required: 'Start datum is verplicht' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Start Tijd
              </label>
              <input
                type="time"
                id="startTime"
                {...register('startTime', { required: 'Start tijd is verplicht' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Eind Datum
              </label>
              <input
                type="date"
                id="endDate"
                {...register('endDate', { required: 'Eind datum is verplicht' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                Eind Tijd
              </label>
              <input
                type="time"
                id="endTime"
                {...register('endTime', { required: 'Eind tijd is verplicht' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {event ? 'Opslaan' : 'Aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};