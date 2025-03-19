import { DragEvent, useState } from 'react';
import styles from './KanbanColumn.module.css';
import { TaskCard } from '../TaskCard';
import type { ITask } from '../../../types/models';

export interface KanbanColumnProps {
  title: string;
  status: ITask['status'];
  tasks: ITask[];
  onTaskMove?: (taskId: string, newStatus: ITask['status']) => void;
  onTaskEdit?: (taskId: string) => void;
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onTaskMove,
  onTaskEdit
}: KanbanColumnProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onTaskMove) {
      onTaskMove(taskId, status);
    }
  };

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>{tasks.length}</span>
      </div>

      <div
        className={`${styles.taskList} ${isDraggingOver ? styles.draggingOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onTaskEdit}
            className={styles.task}
          />
        ))}
      </div>
    </div>
  );
}