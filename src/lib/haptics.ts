/**
 * Haptic feedback utilities for touch interactions
 * Uses the Vibration API where available
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  warning: [20, 30, 20],
  error: [50, 100, 50],
  selection: 5,
};

/**
 * Trigger haptic feedback
 * @param type - The type of haptic feedback
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(hapticPatterns[type]);
    } catch {
      // Silently fail if vibration is not supported
    }
  }
}

/**
 * Check if haptics are supported
 */
export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Hook-like function to get haptic handlers for common interactions
 */
export function getHapticHandlers() {
  return {
    onTap: () => triggerHaptic('light'),
    onPress: () => triggerHaptic('medium'),
    onLongPress: () => triggerHaptic('heavy'),
    onSuccess: () => triggerHaptic('success'),
    onError: () => triggerHaptic('error'),
    onSelection: () => triggerHaptic('selection'),
  };
}
