export interface IUser {
  discord_id: string;
  username: string;
  settings: {
    notifications: {
      discord: boolean;
      email: boolean;
      pushNotifications: boolean;
      notificationTypes: {
        taskAssigned: boolean;
        taskCompleted: boolean;
        taskDue: boolean;
        pointsEarned: boolean;
      };
    };
    theme: 'light' | 'dark';
    language: 'nl' | 'en';
    taskManagement: {
      defaultView: 'list' | 'kanban';
      defaultCategory?: string;
      showCompletedTasks: boolean;
      taskSortOrder: 'dueDate' | 'priority' | 'createdAt';
    };
    gamification: {
      showLeaderboard: boolean;
      showPointsHistory: boolean;
      showAchievements: boolean;
      notifyOnRewards: boolean;
    };
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

export interface CategoryTaskStats {
  completed: number;
  in_progress: number;
  open: number;
}

export interface CategoryInfo extends ICategory {
  id: string;
  task_count: number;
  task_stats: CategoryTaskStats;
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
}