import { CSSProperties } from 'react';
import styles from '@/styles/loading.module.css';
import animations from '@/styles/animations.module.css';
import type { ProgressIndicatorProps, LoadingProps } from '@/types/animation';

export const ProgressIndicator = ({
  progress,
  type = 'bar',
  color = '#4338ca',
  size = 'medium',
  className = ''
}: ProgressIndicatorProps) => {
  const sizeMap = {
    small: { width: '1rem', height: '1rem' },
    medium: { width: '2rem', height: '2rem' },
    large: { width: '3rem', height: '3rem' }
  };

  const containerStyle: CSSProperties = {
    ...sizeMap[size],
    color
  };

  if (type === 'bar') {
    return (
      <div className={`${styles.progressBar} ${className}`}>
        <div
          className={progress !== undefined ? styles.progressFill : styles.progressIndeterminate}
          style={{
            width: progress !== undefined ? `${progress}%` : '100%',
            backgroundColor: color
          }}
        />
      </div>
    );
  }

  if (type === 'spinner') {
    const sizeClass = size === 'small' ? styles.spinnerSmall :
                     size === 'large' ? styles.spinnerLarge :
                     styles.spinner;
    return (
      <div className={`${sizeClass} ${className}`} style={{ borderColor: color, borderTopColor: 'transparent' }} />
    );
  }

  // Dots animation
  // Dots loader
  return (
    <div className={`${styles.loadingContainer} ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={animations.pulse}
          style={{
            width: size === 'small' ? '0.25rem' : size === 'large' ? '0.75rem' : '0.5rem',
            height: size === 'small' ? '0.25rem' : size === 'large' ? '0.75rem' : '0.5rem',
            backgroundColor: color,
            borderRadius: '50%',
            margin: '0 0.25rem',
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  );
};

// Higher-order component for adding loading state
export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  defaultLoadingProps: Partial<LoadingProps> = {}
) => {
  return function WithLoadingComponent({
    loading = false,
    loadingType = defaultLoadingProps.loadingType || 'spinner',
    loadingSize = defaultLoadingProps.loadingSize || 'medium',
    ...props
  }: P & LoadingProps) {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <ProgressIndicator
            type={loadingType}
            size={loadingSize}
          />
        </div>
      );
    }

    return <WrappedComponent {...(props as P)} />;
  };
};