export interface ITask {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed';
  created_by: string;
  assigned_to?: string;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ICategory {
  name: string;
  color: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}