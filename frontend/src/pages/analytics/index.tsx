import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import TaskHistoryTimeline from '../../components/analytics/TaskHistoryTimeline';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { useSelector } from 'react-redux';

const AnalyticsPage: React.FC = () => {
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState(() => new Date());
  
  // Haal server ID uit de huidige context
  const serverId = useSelector((state: any) => state.auth.currentServer?.id);

  if (!serverId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">Selecteer eerst een server om de analyses te bekijken.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Taak Analyses</h1>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start datum
              </label>
              <input
                type="date"
                id="startDate"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Eind datum
              </label>
              <input
                type="date"
                id="endDate"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {/* Analytics Dashboard */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard</h2>
          <AnalyticsDashboard
            serverId={serverId}
          />
        </section>

        {/* Task History Timeline */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Taak Geschiedenis</h2>
          <TaskHistoryTimeline
            serverId={serverId}
            startDate={startDate}
            endDate={endDate}
          />
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;