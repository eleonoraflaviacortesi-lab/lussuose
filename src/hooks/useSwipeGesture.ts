import { useRef, useCallback } from 'react';

type SwipeDirection = 'left' | 'right';

interface UseSwipeGestureOptions {
  onSwipe: (direction: SwipeDirection) => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeGesture({ onSwipe, threshold = 50, enabled = true }: UseSwipeGestureOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = true;
  }, [enabled]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || !swiping.current) return;
    swiping.current = false;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX.current;
    const diffY = endY - startY.current;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      onSwipe(diffX > 0 ? 'right' : 'left');
    }
  }, [enabled, threshold, onSwipe]);

  return { onTouchStart, onTouchEnd };
}
