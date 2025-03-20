import { useState, useCallback, useRef, useEffect } from 'react';
import type { AnimationConfig } from '@/types/animation';

export const useAnimation = (defaultActive = false, config: AnimationConfig = {}) => {
  const [isActive, setIsActive] = useState(defaultActive);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { duration = 300, delay = 0, timing = 'ease' } = config;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const start = useCallback(() => {
    if (delay) {
      timeoutRef.current = setTimeout(() => setIsActive(true), delay);
    } else {
      setIsActive(true);
    }
  }, [delay]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsActive(false);
  }, []);

  const toggle = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  const style = {
    transition: `all ${duration}ms ${timing}`,
  };

  return { isActive, start, stop, toggle, style };
};