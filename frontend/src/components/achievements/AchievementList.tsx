import React from 'react';
import { Achievement, AchievementProgress } from '@/types/achievement';
import { AchievementCard } from './AchievementCard';
import { motion, AnimatePresence } from 'framer-motion';

interface AchievementListProps {
  achievements: Achievement[];
  progress: Record<string, AchievementProgress>;
  onUnlock?: (achievementId: string) => void;
}

export const AchievementList: React.FC<AchievementListProps> = ({
  achievements,
  progress,
  onUnlock
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            <AchievementCard
              achievement={achievement}
              progress={progress[achievement.id]}
              onUnlock={() => onUnlock?.(achievement.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AchievementList;