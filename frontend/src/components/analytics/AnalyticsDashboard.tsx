import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  fetchAnalytics,
  fetchMetricTrends,
  fetchComparativeStats,
} from '../../store/slices/analyticsSlice';

// Registreer Chart.js componenten
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardProps {
  serverId: string;
}

type TimeframeOption = 'daily' | 'weekly' | 'monthly';

export const AnalyticsDashboard: React.FC<DashboardProps> = ({ serverId }) => {
  const dispatch = useDispatch();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('weekly');
  const analytics = useSelector((state: any) => state.analytics);

  // Bereken datum ranges gebaseerd op timeframe
  const getDateRange = () => {
    const end = new Date();
    let start;
    switch (timeframe) {
      case 'daily':
        start = subDays(end, 7);
        break;
      case 'weekly':
        start = subWeeks(end, 4);
        break;
      case 'monthly':
        start = subMonths(end, 6);
        break;
      default:
        start = subWeeks(end, 4);
    }
    return { start, end };
  };

  // Laad data wanneer component mount of timeframe verandert
  useEffect(() => {
    const { start, end } = getDateRange();
    
    dispatch(fetchAnalytics({
      serverId,
      timeframe,
      startDate: start,
      endDate: end,
    }) as any);

    dispatch(fetchMetricTrends({
      serverId,
      timeframe,
      metrics: ['totalTasks', 'completedTasks', 'averageCompletionTime'],
      startDate: start,
      endDate: end,
    }) as any);

    dispatch(fetchComparativeStats({
      serverId,
      timeframe,
      currentPeriodStart: start,
      metrics: ['totalTasks', 'completedTasks', 'averageCompletionTime'],
    }) as any);
  }, [dispatch, serverId, timeframe]);

  // Completie ratio trend grafiek data
  const completionRatioData = {
    labels: analytics.data.map((d: any) => 
      format(new Date(d.date), 'd MMM', { locale: nl })
    ),
    datasets: [{
      label: 'Voltooiingsratio',
      data: analytics.data.map((d: any) => 
        (d.metrics.completedTasks / d.metrics.totalTasks) * 100
      ),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    }],
  };

  // Taken per prioriteit donut chart data
  const priorityData = {
    labels: ['Hoog', 'Medium', 'Laag'],
    datasets: [{
      data: [
        analytics.data[0]?.metrics.tasksByPriority.high || 0,
        analytics.data[0]?.metrics.tasksByPriority.medium || 0,
        analytics.data[0]?.metrics.tasksByPriority.low || 0,
      ],
      backgroundColor: [
        'rgb(239, 68, 68)',
        'rgb(234, 179, 8)',
        'rgb(34, 197, 94)',
      ],
    }],
  };

  // Gemiddelde voltooiingstijd trend data
  const completionTimeData = {
    labels: analytics.trends.averageCompletionTime?.map((d: any) =>
      format(new Date(d.date), 'd MMM', { locale: nl })
    ) || [],
    datasets: [{
      label: 'Gemiddelde voltooiingstijd (minuten)',
      data: analytics.trends.averageCompletionTime?.map((d: any) =>
        Math.round(d.value / 1000 / 60)
      ) || [],
      backgroundColor: 'rgba(147, 51, 234, 0.5)',
    }],
  };

  if (analytics.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="text-center text-red-600 p-4">
        Er is een fout opgetreden: {analytics.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeframe selector */}
      <div className="flex justify-end">
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as TimeframeOption)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="daily">Dagelijks</option>
          <option value="weekly">Wekelijks</option>
          <option value="monthly">Maandelijks</option>
        </select>
      </div>

      {/* Statistieken overzicht */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analytics.comparisons && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Totaal Taken</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {analytics.comparisons.current.totalTasks}
                </span>
                <span className={`ml-2 ${
                  analytics.comparisons.changes.totalTasks > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {analytics.comparisons.changes.totalTasks > 0 ? '↑' : '↓'}
                  {Math.abs(analytics.comparisons.changes.totalTasks)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Voltooide Taken</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {analytics.comparisons.current.completedTasks}
                </span>
                <span className={`ml-2 ${
                  analytics.comparisons.changes.completedTasks > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {analytics.comparisons.changes.completedTasks > 0 ? '↑' : '↓'}
                  {Math.abs(analytics.comparisons.changes.completedTasks)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Gem. Voltooiingstijd</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {Math.round(analytics.comparisons.current.averageCompletionTime / 1000 / 60)}m
                </span>
                <span className={`ml-2 ${
                  analytics.comparisons.changes.averageCompletionTime < 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {analytics.comparisons.changes.averageCompletionTime < 0 ? '↓' : '↑'}
                  {Math.abs(analytics.comparisons.changes.averageCompletionTime)}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Grafieken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Voltooiingsratio Trend</h3>
          <Line
            data={completionRatioData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: (value: number | string) => `${value}%`,
                  },
                },
              },
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Taken per Prioriteit</h3>
          <div className="h-[300px] flex justify-center">
            <Doughnut
              data={priorityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gemiddelde Voltooiingstijd Trend</h3>
          <Bar
            data={completionTimeData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value: number | string) => `${value}m`,
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;