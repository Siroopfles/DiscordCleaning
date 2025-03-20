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

export interface IUserSettings {
  notifications: {
    email: boolean;
    discord: boolean;
    desktop: boolean;
    frequency: 'realtime' | 'hourly' | 'daily';
  };
  theme: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  language: 'nl' | 'en';
  privacy: {
    showOnline: boolean;
    showActivity: boolean;
    shareStats: boolean;
  };
  updatedAt: Date;
}