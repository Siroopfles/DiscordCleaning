import { useState, useCallback, useEffect } from 'react';
import { useAnimation } from './useAnimation';
import { AchievementAnimationConfig, PointsAnimationConfig } from '@/types/animation';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';

export const useAchievementAnimation = (config: AchievementAnimationConfig = {}) => {
  const controls = useAnimationControls();
  const [isUnlocked, setIsUnlocked] = useState(false);

  const { duration = 600, delay = 0, scale = 1.1, rotate = 5, glow = true } = config;

  const playUnlockAnimation = useCallback(async () => {
    setIsUnlocked(true);
    await controls.start({
      scale: [1, scale, 1],
      rotate: [0, -rotate, rotate, 0],
      transition: {
        duration: duration / 1000,
        delay: delay / 1000,
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    });
  }, [controls, scale, rotate, duration, delay]);

  return {
    controls,
    isUnlocked,
    playUnlockAnimation,
    unlockAnimationProps: {
      initial: { scale: 1, rotate: 0 },
      className: glow ? 'achievement-glow' : ''
    }
  };
};

export const usePointsAnimation = (config: PointsAnimationConfig = {}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimationControls();

  const {
    duration = 1000,
    delay = 0,
    direction = 'up',
    distance = 50,
    spread = 20
  } = config;

  const playPointsAnimation = useCallback(async (points: number) => {
    setIsAnimating(true);
    
    await controls.start({
      y: direction === 'up' ? -distance : distance,
      x: [-spread/2, 0, spread/2],
      opacity: [0, 1, 0],
      transition: {
        duration: duration / 1000,
        delay: delay / 1000,
        ease: "easeOut"
      }
    });

    setIsAnimating(false);
  }, [controls, direction, distance, spread, duration, delay]);

  return {
    controls,
    isAnimating,
    playPointsAnimation,
    pointsAnimationProps: {
      initial: { opacity: 0, y: 0, x: 0 },
      style: { position: 'absolute', pointerEvents: 'none' }
    }
  };
};