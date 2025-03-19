import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanColumn } from '../KanbanColumn';
import type { ITask } from '../../../../types/models';

const mockTasks: ITask[] = [
  {
    id: '1',
    title: 'Test Task 1',
    status: 'todo',
    priority: 'medium',
    category: 'Testing',
    created_by: 'user1',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    title: 'Test Task 2',
    status: 'todo',
    priority: 'high',
    category: 'Testing',
    created_by: 'user1',
    created_at: new Date(),
    updated_at: new Date()
  }
];

describe('KanbanColumn', () => {
  it('renders column title and task count', () => {
    render(
      <KanbanColumn
        title="To Do"
        status="todo"
        tasks={mockTasks}
      />
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders all tasks', () => {
    render(
      <KanbanColumn
        title="To Do"
        status="todo"
        tasks={mockTasks}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('handles task movement through drag and drop', () => {
    const onTaskMove = jest.fn();
    
    render(
      <KanbanColumn
        title="To Do"
        status="in_progress"
        tasks={mockTasks}
        onTaskMove={onTaskMove}
      />
    );

    const column = screen.getByRole('heading', { name: 'To Do' }).parentElement?.parentElement;
    expect(column).toBeInTheDocument();

    if (column) {
      // Simulate drop
      fireEvent.dragOver(column);
      expect(column.querySelector('[class*="draggingOver"]')).toBeInTheDocument();

      fireEvent.drop(column, {
        dataTransfer: {
          getData: () => '1'
        }
      });

      expect(onTaskMove).toHaveBeenCalledWith('1', 'in_progress');
      expect(column.querySelector('[class*="draggingOver"]')).not.toBeInTheDocument();
    }
  });

  it('calls onTaskEdit when edit button is clicked', () => {
    const onTaskEdit = jest.fn();
    
    render(
      <KanbanColumn
        title="To Do"
        status="todo"
        tasks={mockTasks}
        onTaskEdit={onTaskEdit}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(onTaskEdit).toHaveBeenCalledWith('1');
  });

  it('handles drag leave event', () => {
    render(
      <KanbanColumn
        title="To Do"
        status="todo"
        tasks={mockTasks}
      />
    );

    const column = screen.getByRole('heading', { name: 'To Do' }).parentElement?.parentElement;
    expect(column).toBeInTheDocument();

    if (column) {
      fireEvent.dragOver(column);
      expect(column.querySelector('[class*="draggingOver"]')).toBeInTheDocument();

      fireEvent.dragLeave(column);
      expect(column.querySelector('[class*="draggingOver"]')).not.toBeInTheDocument();
    }
  });
});