import styles from '@/styles/loading.module.css';
import animations from '@/styles/animations.module.css';
import type { SkeletonProps, SkeletonTextProps, SkeletonCardProps } from '@/types/animation';

export const Skeleton = ({
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
  className = '',
  children
}: SkeletonProps) => {
  const style = {
    width,
    height,
    borderRadius,
  };

  return (
    <div className={`${styles.skeleton} ${animations.fadeIn} ${className}`} style={style}>
      {children}
    </div>
  );
};

export const SkeletonText = ({
  lines = 3,
  spacing = '0.5rem',
  width = '100%'
}: SkeletonTextProps) => {
  return (
    <div className={animations.fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={typeof width === 'string' ? width : `${width * (1 - i * 0.1)}px`}
          height="1rem"
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({
  width = '100%',
  height = '200px',
  className = ''
}: SkeletonCardProps) => {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius="0.5rem"
      className={className}
    >
      <div className={animations.fadeIn} style={{ padding: '1rem' }}>
        <Skeleton width="60%" height="1.5rem" className={`${styles.skeletonText} mb-4`} />
        <SkeletonText lines={2} width="100%" />
      </div>
    </Skeleton>
  );
};