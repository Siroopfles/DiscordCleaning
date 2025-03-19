export interface IUser {
  discord_id: string;
  username: string;
  settings: {
    notifications: boolean;
    theme: string;
    language: string;
  };
}

export interface ITask {
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

export interface IServer {
  discord_server_id: string;
  name: string;
  settings: {
    prefix: string;
    language: string;
    timezone: string;
    notification_channel?: string;
  };
  created_at: Date;
  updated_at: Date;
}