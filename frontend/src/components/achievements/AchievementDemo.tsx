import React from 'react';
import { Achievement, AchievementProgress } from '@/types/achievement';
import { AchievementCard } from './AchievementCard';

const demoAchievement: Achievement = {
  id: 'demo1',
  title: 'Eerste Stappen',
  description: 'Voltooi je eerste taak in het systeem',
  category: 'beginner',
  requirementType: 'task_completion',
  points: 100,
  requiredValue: 1,
  icon: 'trophy',
  createdAt: new Date(),
  updatedAt: new Date()
};

export const AchievementDemo: React.FC = () => {
  const [progress, setProgress] = React.useState<AchievementProgress>({
    id: 'progress1',
    achievementId: 'demo1',
    userId: 'demo-user',
    currentValue: 0,
    completed: false,
    currentStreak: 0,
    lastUpdated: new Date()
  });

  const handleComplete = () => {
    setProgress(prev => ({
      ...prev,
      currentValue: prev.currentValue + 1,
      completed: true,
      lastUpdated: new Date()
    }));
  };

  const handleReset = () => {
    setProgress({
      id: 'progress1',
      achievementId: 'demo1',
      userId: 'demo-user',
      currentValue: 0,
      completed: false,
      currentStreak: 0,
      lastUpdated: new Date()
    });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-4">
        <AchievementCard
          achievement={demoAchievement}
          progress={progress}
          onUnlock={() => console.log('Achievement unlocked!')}
        />
      </div>
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleComplete}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={progress.completed}
        >
          Complete Achievement
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
};