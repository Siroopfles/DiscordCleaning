import React from 'react';
import { KanbanColumn } from '../KanbanColumn/KanbanColumn';
import type { ITask } from '../../../types/models';
import styles from './KanbanBoard.module.css';

export interface KanbanBoardProps {
  tasks: ITask[];
  onTaskMove?: (taskId: string, newStatus: ITask['status']) => void;
  onTaskEdit?: (taskId: string) => void;
}

const COLUMNS: { title: string; status: ITask['status'] }[] = [
  { title: 'To Do', status: 'todo' },
  { title: 'In Progress', status: 'in_progress' },
  { title: 'Done', status: 'completed' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskMove,
  onTaskEdit
}) => {
  return (
    <div className={styles.board}>
      {COLUMNS.map(({ title, status }) => (
        <KanbanColumn
          key={status}
          title={title}
          status={status}
          tasks={tasks.filter(task => task.status === status)}
          onTaskMove={onTaskMove}
          onTaskEdit={onTaskEdit}
        />
      ))}
    </div>
  );
};