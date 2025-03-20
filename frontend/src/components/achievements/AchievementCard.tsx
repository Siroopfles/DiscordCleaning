import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Achievement, AchievementProgress } from '@/types/achievement';
import { IconType, IconBaseProps } from 'react-icons';
import { FaTrophy, FaStar, FaMedal, FaCrown } from 'react-icons/fa';
import { useAchievementAnimation, usePointsAnimation } from '@/hooks/useAchievementEffects';
import styles from '@/styles/achievement.module.css';

interface AchievementCardProps {
  achievement: Achievement;
  progress?: AchievementProgress;
  onUnlock?: () => void;
}

const achievementIcons: Record<string, IconType> = {
  trophy: FaTrophy,
  star: FaStar,
  medal: FaMedal,
  crown: FaCrown,
};

export const AchievementCard: React.FC<AchievementCardProps> = ({ 
  achievement, 
  progress,
  onUnlock 
}) => {
  const Icon = achievement.icon ? achievementIcons[achievement.icon] : FaTrophy;
  const progressPercentage = progress
    ? Math.min((progress.currentValue / achievement.requiredValue) * 100, 100)
    : 0;

  const { controls: achievementControls, isUnlocked, playUnlockAnimation, unlockAnimationProps } = useAchievementAnimation({
    scale: 1.1,
    rotate: 5,
    glow: true,
    duration: 600
  });

  const { controls: pointsControls, isAnimating, playPointsAnimation, pointsAnimationProps } = usePointsAnimation({
    direction: 'up',
    distance: 50,
    spread: 20,
    duration: 1000
  });

  React.useEffect(() => {
    if (progress?.completed && !isUnlocked) {
      playUnlockAnimation();
      playPointsAnimation(achievement.points);
      onUnlock?.();
    }
  }, [progress?.completed, isUnlocked, playUnlockAnimation, playPointsAnimation, achievement.points, onUnlock]);

  return (
    <motion.div
      animate={achievementControls}
      {...unlockAnimationProps}
      className={`${styles.achievementCard} bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-start space-x-4">
        <motion.div 
          className={`p-3 rounded-full ${progress?.completed ? 'bg-green-100' : 'bg-gray-100'} ${styles.achievementIcon}`}
        >
          <Icon
            size={24}
            color={progress?.completed ? '#059669' : '#4B5563'}
          />
        </motion.div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{achievement.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{achievement.description}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {progress?.currentValue || 0} / {achievement.requiredValue}
              </span>
              <motion.span
                animate={pointsControls}
                initial={pointsAnimationProps.initial}
                style={{ 
                  position: 'absolute' as const,
                  pointerEvents: 'none' as const
                }}
                className={`text-blue-600 ${styles.pointsOverlay}`}
              >
                +{achievement.points}
              </motion.span>
              <span className="text-blue-600">{achievement.points} pts</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  progress?.completed ? 'bg-green-500' : 'bg-blue-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementCard;