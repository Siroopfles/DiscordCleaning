declare module 'react-big-calendar' {
  import { ComponentType } from 'react';
  
  export interface Event {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
  }

  export interface SlotInfo {
    start: Date;
    end: Date;
    slots: Date[];
    action: 'select' | 'click' | 'doubleClick';
    bounds: {
      x: number;
      y: number;
      top: number;
      right: number;
      left: number;
      bottom: number;
    };
    box: {
      x: number;
      y: number;
      clientX: number;
      clientY: number;
    };
  }

  export interface CalendarProps<TEvent = Event> {
    localizer: DateLocalizer;
    events: TEvent[];
    startAccessor?: keyof TEvent | ((event: TEvent) => Date);
    endAccessor?: keyof TEvent | ((event: TEvent) => Date);
    titleAccessor?: keyof TEvent | ((event: TEvent) => string);
    view?: View;
    views?: View[];
    onView?: (view: View) => void;
    date?: Date;
    onNavigate?: (newDate: Date, view: View, action: NavigateAction) => void;
    onRangeChange?: (range: Date[] | { start: Date; end: Date }, view?: View) => void;
    onSelectEvent?: (event: TEvent) => void;
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    onDoubleClickEvent?: (event: TEvent) => void;
    onKeyPressEvent?: (event: TEvent) => void;
    defaultView?: View;
    className?: string;
    style?: React.CSSProperties;
    selectable?: boolean;
    popup?: boolean;
    messages?: {
      date?: string;
      time?: string;
      event?: string;
      allDay?: string;
      week?: string;
      work_week?: string;
      day?: string;
      month?: string;
      previous?: string;
      next?: string;
      today?: string;
      agenda?: string;
      showMore?: (total: number) => string;
    };
  }

  export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';
  export type NavigateAction = 'PREV' | 'NEXT' | 'TODAY' | 'DATE';

  export interface DateLocalizer {
    format(value: Date, format: string, culture?: string): string;
    startOf(value: Date, unit: 'month' | 'week' | 'day'): Date;
    endOf(value: Date, unit: 'month' | 'week' | 'day'): Date;
    add(value: Date, amount: number, unit: 'month' | 'week' | 'day'): Date;
  }

  export interface DateFormat {
    (date: Date, format: string, culture?: string): string;
  }

  export interface DateRangeFormat {
    (range: { start: Date; end: Date }, culture?: string): string;
  }

  export function dateFnsLocalizer(args: {
    format: (date: Date, format: string, options?: { locale?: Locale }) => string;
    parse: (dateString: string, format: string, options?: { locale?: any }) => Date;
    startOfWeek: (date: Date, options?: { locale?: any }) => Date;
    getDay: (date: Date) => number;
    locales: { [key: string]: any };
  }): DateLocalizer;

  export const Calendar: <TEvent = Event>(props: CalendarProps<TEvent>) => JSX.Element;
}

declare module 'react-big-calendar/lib/css/react-big-calendar.css';