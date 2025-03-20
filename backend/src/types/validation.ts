export interface UpdateSettingsDto {
  notifications?: {
    discord?: boolean;
    email?: boolean;
    pushNotifications?: boolean;
    notificationTypes?: {
      taskAssigned?: boolean;
      taskCompleted?: boolean;
      taskDue?: boolean;
      pointsEarned?: boolean;
    };
  };
  theme?: 'light' | 'dark';
  language?: 'nl' | 'en';
  taskManagement?: {
    defaultView?: 'list' | 'kanban';
    defaultCategory?: string;
    showCompletedTasks?: boolean;
    taskSortOrder?: 'dueDate' | 'priority' | 'createdAt';
  };
  gamification?: {
    showLeaderboard?: boolean;
    showPointsHistory?: boolean;
    showAchievements?: boolean;
    notifyOnRewards?: boolean;
  };
}

export interface UpdateNotificationSettingsDto {
  discord?: boolean;
  email?: boolean;
  pushNotifications?: boolean;
  notificationTypes?: {
    taskAssigned?: boolean;
    taskCompleted?: boolean;
    taskDue?: boolean;
    pointsEarned?: boolean;
  };
}

export interface UpdateTaskManagementSettingsDto {
  defaultView?: 'list' | 'kanban';
  defaultCategory?: string;
  showCompletedTasks?: boolean;
  taskSortOrder?: 'dueDate' | 'priority' | 'createdAt';
}

export interface UpdateGamificationSettingsDto {
  showLeaderboard?: boolean;
  showPointsHistory?: boolean;
  showAchievements?: boolean;
  notifyOnRewards?: boolean;
}