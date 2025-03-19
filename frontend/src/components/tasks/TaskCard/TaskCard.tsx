import { DragEvent, HTMLAttributes } from 'react';
import styles from './TaskCard.module.css';
import { ITask } from '../../../types/models';
import { Button } from '../../Button';

export interface TaskCardProps extends HTMLAttributes<HTMLDivElement> {
  task: ITask;
  onStatusChange?: (taskId: string, newStatus: ITask['status']) => void;
  onEdit?: (taskId: string) => void;
  draggable?: boolean;
}

export function TaskCard({
  task,
  onStatusChange,
  onEdit,
  draggable = true,
  className = '',
  ...props
}: TaskCardProps) {
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const cardClasses = [
    styles.card,
    styles[`priority_${task.priority}`],
    styles[`status_${task.status}`],
    className
  ]
    .filter(Boolean)
    .join(' ');

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div
      className={cardClasses}
      draggable={draggable}
      onDragStart={handleDragStart}
      {...props}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{task.title}</h3>
        <span className={styles.priority}>{task.priority}</span>
      </div>
      
      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}
      
      <div className={styles.details}>
        <span className={styles.category}>{task.category}</span>
        {task.due_date && (
          <span className={styles.dueDate}>
            Due: {formatDate(task.due_date)}
          </span>
        )}
      </div>
      
      <div className={styles.footer}>
        <span className={styles.assignee}>
          {task.assigned_to || 'Unassigned'}
        </span>
        <div className={styles.actions}>
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(task.id)}
              aria-label="Edit task"
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}