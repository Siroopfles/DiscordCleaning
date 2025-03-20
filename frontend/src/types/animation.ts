export interface AnimationConfig {
  duration?: number;
  delay?: number;
  timing?: 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface UseInteractionConfig extends AnimationConfig {
  onStart?: () => void;
  onEnd?: () => void;
}

export interface UseHoverConfig extends AnimationConfig {
  scale?: number;
  lift?: number;
}

export interface UsePressConfig extends AnimationConfig {
  scale?: number;
}

export interface LoadingProps {
  loading?: boolean;
  loadingType?: 'bar' | 'spinner' | 'dots';
  loadingSize?: 'small' | 'medium' | 'large';
}

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  children?: React.ReactNode;
}

export interface SkeletonTextProps {
  lines?: number;
  spacing?: string | number;
  width?: string | number;
}

export interface SkeletonCardProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export interface ProgressIndicatorProps {
  progress?: number;
  type?: 'bar' | 'spinner' | 'dots';
  color?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface AchievementAnimationConfig extends AnimationConfig {
  scale?: number;
  rotate?: number;
  glow?: boolean;
}

export interface PointsAnimationConfig extends AnimationConfig {
  direction?: 'up' | 'down';
  distance?: number;
  spread?: number;
}