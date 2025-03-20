import type { UseInteractionConfig, UseHoverConfig, UsePressConfig } from '@/types/animation';
import { useAnimation } from './useAnimation';
import { useState, useCallback } from 'react';

export const useInteraction = (config: UseInteractionConfig = {}) => {
  const { onStart, onEnd, ...animationConfig } = config;
  const { isActive, start, stop, style } = useAnimation(false, animationConfig);

  const handleStart = useCallback(() => {
    start();
    onStart?.();
  }, [start, onStart]);

  const handleEnd = useCallback(() => {
    stop();
    onEnd?.();
  }, [stop, onEnd]);

  return {
    isActive,
    handleStart,
    handleEnd,
    style,
    eventHandlers: {
      onMouseEnter: handleStart,
      onMouseLeave: handleEnd,
      onFocus: handleStart,
      onBlur: handleEnd,
    },
  };
};

export const useHover = (config: UseHoverConfig = {}) => {
  const { scale = 1.02, lift = 2, ...animationConfig } = config;
  const { isActive, eventHandlers, style } = useInteraction(animationConfig);

  const hoverStyle = {
    ...style,
    transform: isActive ? `scale(${scale}) translateY(-${lift}px)` : 'none',
  };

  return { isActive, eventHandlers, style: hoverStyle };
};

export const usePress = (config: UsePressConfig = {}) => {
  const { scale = 0.98, ...animationConfig } = config;
  const [isPressed, setIsPressed] = useState(false);
  const { style } = useAnimation(false, animationConfig);

  const pressStyle = {
    ...style,
    transform: isPressed ? `scale(${scale})` : 'none',
  };

  const eventHandlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
  };

  return { isPressed, eventHandlers, style: pressStyle };
};