import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskCard } from '../TaskCard';
import { ITask } from '../../../../types/models';

describe('TaskCard', () => {
  const mockTask: ITask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    category: 'Test Category',
    priority: 'medium',
    status: 'todo',
    created_by: 'user1',
    created_at: new Date('2024-03-19'),
    updated_at: new Date('2024-03-19')
  };

  const mockOnEdit = jest.fn();
  const mockOnStatusChange = jest.fn();

  it('renders task information correctly', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('handles optional fields correctly', () => {
    const taskWithoutOptionals: ITask = {
      ...mockTask,
      description: undefined,
      assigned_to: undefined,
      due_date: undefined
    };

    render(<TaskCard task={taskWithoutOptionals} />);
    
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('applies correct priority styles', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    expect(container.firstChild).toHaveClass('priority_medium');
  });

  it('applies correct status styles', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    expect(container.firstChild).toHaveClass('status_todo');
  });

  it('handles drag events correctly', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    const card = container.firstChild as HTMLElement;
    
    fireEvent.dragStart(card);
    
    const mockDataTransfer = {
      setData: jest.fn(),
      effectAllowed: ''
    };
    
    fireEvent.dragStart(card, { dataTransfer: mockDataTransfer });
    
    expect(mockDataTransfer.setData).toHaveBeenCalledWith('taskId', '1');
    expect(mockDataTransfer.effectAllowed).toBe('move');
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} />);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });

  it('does not render edit button when onEdit is not provided', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('respects draggable prop', () => {
    const { container } = render(<TaskCard task={mockTask} draggable={false} />);
    expect(container.firstChild).toHaveAttribute('draggable', 'false');
  });
});