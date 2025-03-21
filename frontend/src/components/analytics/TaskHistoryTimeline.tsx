import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  fetchTaskHistory,
  selectFilteredHistory,
  setFilters,
  TaskHistoryItem
} from '../../store/slices/taskHistorySlice';

interface TimelineProps {
  serverId: string;
  startDate: Date;
  endDate: Date;
}

interface GroupedHistory {
  [date: string]: TaskHistoryItem[];
}

const actionIcons = {
  created: '➕',
  updated: '✏️',
  completed: '✅',
  deleted: '🗑️',
};

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

export const TaskHistoryTimeline: React.FC<TimelineProps> = ({
  serverId,
  startDate,
  endDate,
}) => {
  const dispatch = useDispatch();
  const history = useSelector(selectFilteredHistory);
  const loading = useSelector((state: any) => state.taskHistory.loading);
  const error = useSelector((state: any) => state.taskHistory.error);

  useEffect(() => {
    dispatch(fetchTaskHistory({
      serverId,
      startDate,
      endDate,
    }) as any);
  }, [dispatch, serverId, startDate, endDate]);

  const groupedHistory: GroupedHistory = useMemo(() => {
    return history.reduce((groups, item) => {
      const date = format(new Date(item.timestamp), 'yyyy-MM-dd');
      return {
        ...groups,
        [date]: [...(groups[date] || []), item],
      };
    }, {} as GroupedHistory);
  }, [history]);

  const formatMetadata = (item: TaskHistoryItem) => {
    const parts = [];
    
    if (item.metadata?.priority) {
      parts.push(
        <span
          key="priority"
          className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-2 ${
            priorityColors[item.metadata.priority.toLowerCase() as keyof typeof priorityColors]
          }`}
        >
          {item.metadata.priority}
        </span>
      );
    }
    
    if (item.metadata?.completionTime) {
      parts.push(
        <span key="time" className="text-gray-600 text-sm">
          ⏱️ {Math.round(item.metadata.completionTime / 1000 / 60)}m
        </span>
      );
    }
    
    return parts;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Er is een fout opgetreden: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedHistory)
        .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
        .map(([date, items]) => (
          <div key={date} className="relative">
            <div className="sticky top-0 bg-white z-10 py-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {format(new Date(date), 'EEEE d MMMM yyyy', { locale: nl })}
              </h3>
            </div>
            <div className="ml-4 space-y-4">
              {items
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((item) => (
                  <div
                    key={`${item.taskId}-${item.timestamp}`}
                    className="relative pb-4 group"
                  >
                    <div className="absolute left-0 top-2 -ml-2">
                      <div className="h-4 w-4 rounded-full bg-gray-200 border-2 border-white group-hover:bg-primary-500 transition-colors"></div>
                    </div>
                    <div className="ml-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl" role="img" aria-label={item.action}>
                          {actionIcons[item.action]}
                        </span>
                        <time className="text-sm text-gray-500">
                          {format(new Date(item.timestamp), 'HH:mm')}
                        </time>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {formatMetadata(item)}
                      </div>
                      {item.action === 'updated' && (
                        <div className="mt-2 text-sm text-gray-600">
                          <details className="cursor-pointer">
                            <summary className="hover:text-primary-600">
                              Bekijk wijzigingen
                            </summary>
                            <div className="mt-2 pl-4 border-l-2 border-gray-200">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(
                                  {
                                    van: item.previousState,
                                    naar: item.newState,
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default TaskHistoryTimeline;