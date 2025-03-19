/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KanbanBoard } from '../KanbanBoard';
import type { ITask } from '../../../../types/models';

const mockTasks: ITask[] = [
  {
    id: '1',
    title: 'Task 1',
    status: 'todo',
    priority: 'medium',
    category: 'Testing',
    created_by: 'user1',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    title: 'Task 2',
    status: 'in_progress',
    priority: 'high',
    category: 'Testing',
    created_by: 'user1',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '3',
    title: 'Task 3',
    status: 'completed',
    priority: 'low',
    category: 'Testing',
    created_by: 'user1',
    created_at: new Date(),
    updated_at: new Date()
  }
];

describe('KanbanBoard', () => {
  it('renders all columns', () => {
    render(<KanbanBoard tasks={mockTasks} />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('filters tasks correctly per column', () => {
    render(<KanbanBoard tasks={mockTasks} />);
    
    const todoColumn = screen.getByText('To Do').closest('[class*="column"]');
    const inProgressColumn = screen.getByText('In Progress').closest('[class*="column"]');
    const doneColumn = screen.getByText('Done').closest('[class*="column"]');

    expect(todoColumn).toHaveTextContent('Task 1');
    expect(inProgressColumn).toHaveTextContent('Task 2');
    expect(doneColumn).toHaveTextContent('Task 3');
  });

  it('handles task movement between columns', () => {
    const onTaskMove = jest.fn();
    render(<KanbanBoard tasks={mockTasks} onTaskMove={onTaskMove} />);
    
    const inProgressColumn = screen.getByText('In Progress').closest('[class*="column"]');
    expect(inProgressColumn).toBeInTheDocument();

    if (inProgressColumn) {
      fireEvent.drop(inProgressColumn, {
        dataTransfer: {
          getData: () => '1'
        }
      });

      expect(onTaskMove).toHaveBeenCalledWith('1', 'in_progress');
    }
  });

  it('calls onTaskEdit when edit button is clicked', () => {
    const onTaskEdit = jest.fn();
    render(<KanbanBoard tasks={mockTasks} onTaskEdit={onTaskEdit} />);

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(onTaskEdit).toHaveBeenCalledWith('1');
  });

  it('renders responsively', () => {
    const { container } = render(<KanbanBoard tasks={mockTasks} />);
    const board = container.firstChild;
    
    expect(board).toHaveClass('board');
    expect(window.getComputedStyle(board as Element).display).toBe('flex');
  });
});