import { useState } from 'react';
import { Skeleton, SkeletonCard, ProgressIndicator } from './';
import { useHover, usePress } from '@/hooks/useInteraction';
import styles from '@/styles/animations.module.css';

export const AnimationExample = () => {
  const [loading, setLoading] = useState(true);
  const { eventHandlers: hoverHandlers, style: hoverStyle } = useHover();
  const { eventHandlers: pressHandlers, style: pressStyle } = usePress();

  // Simulate loading state
  setTimeout(() => setLoading(false), 2000);

  return (
    <div className="space-y-8 p-4">
      {/* Loading States */}
      <section>
        <h2 className="text-xl font-bold mb-4">Loading States</h2>
        <div className="space-y-4">
          <ProgressIndicator type="bar" progress={75} />
          <ProgressIndicator type="spinner" />
          <ProgressIndicator type="dots" />
        </div>
      </section>

      {/* Skeleton Loading */}
      <section>
        <h2 className="text-xl font-bold mb-4">Skeleton Loading</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <div className="space-y-4">
            <Skeleton height="2rem" width="60%" />
            <Skeleton height="4rem" />
            <Skeleton height="1rem" width="80%" />
          </div>
        </div>
      </section>

      {/* Animation Classes */}
      <section>
        <h2 className="text-xl font-bold mb-4">Animation Classes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={styles.fadeIn}>Fade In</div>
          <div className={styles.slideIn}>Slide In</div>
          <div className={styles.pulse}>Pulse</div>
          <div className={styles.spin}>Spin</div>
        </div>
      </section>

      {/* Interactive Animations */}
      <section>
        <h2 className="text-xl font-bold mb-4">Interactive Animations</h2>
        <div className="flex gap-4">
          <button
            {...hoverHandlers}
            style={hoverStyle}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Hover Me
          </button>
          <button
            {...pressHandlers}
            style={pressStyle}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Press Me
          </button>
        </div>
      </section>

      {/* Content Loading */}
      <section>
        <h2 className="text-xl font-bold mb-4">Content Loading</h2>
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <ProgressIndicator type="bar" />
          </div>
        ) : (
          <div className={styles.fadeIn}>
            <h3 className="text-lg font-semibold">Loaded Content</h3>
            <p>This content appears after loading with a fade in animation.</p>
          </div>
        )}
      </section>
    </div>
  );
};