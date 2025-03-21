import React from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { withAuth } from '@/components/auth/withAuth';

const CalendarPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <CalendarView className="bg-white rounded-lg shadow-lg p-6" />
    </div>
  );
};

// Export with authentication wrapper
export default withAuth(CalendarPage);