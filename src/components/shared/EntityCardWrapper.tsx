import { memo, useCallback, useRef, ReactNode } from 'react';
import { cn, isDarkColor } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

interface EntityCardWrapperProps {
  cardColor: string | null;
  isDragging?: boolean;
  onClick: () => void;
  onContextAction: (pos: { x: number; y: number }) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Shared wrapper for kanban cards handling:
 * - Background color / dark detection
 * - Long-press (touch) and right-click context menu
 * - Drag state visual feedback
 * - Active press scale animation
 */
export const EntityCardWrapper = memo(({
  cardColor,
  isDragging,
  onClick,
  onContextAction,
  children,
  className,
}: EntityCardWrapperProps) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const pickerWasOpen = useRef(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic('medium');
    onContextAction({ x: e.clientX, y: e.clientY });
  }, [onContextAction]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      onContextAction({ x: touch.clientX, y: touch.clientY });
      pickerWasOpen.current = true;
    }, 500);
  }, [onContextAction]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (pickerWasOpen.current) {
      pickerWasOpen.current = false;
      return;
    }
    triggerHaptic('light');
    onClick();
  }, [onClick]);

  return (
    <div
      className={cn(
        "rounded-xl p-2 lg:p-2 cursor-pointer transition-all duration-100 border border-border/30 select-none active:scale-[0.97]",
        cardColor ? "backdrop-blur-sm" : "bg-card",
        isDragging && "opacity-70 rotate-2",
        className,
      )}
      style={cardColor ? {
        backgroundColor: cardColor,
        boxShadow: 'none'
      } : undefined}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
});
EntityCardWrapper.displayName = 'EntityCardWrapper';
