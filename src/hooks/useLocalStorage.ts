import { useState, useCallback } from 'react';
import { getLS, setLS, removeLS } from '@/lib/localStorage';

/**
 * React hook for localStorage with JSON serialization and try/catch safety.
 * Returns [value, setValue, removeValue].
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => getLS<T>(key, defaultValue));

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const next = value instanceof Function ? value(prev) : value;
      setLS(key, next);
      return next;
    });
  }, [key]);

  const removeValue = useCallback(() => {
    removeLS(key);
    setStoredValue(defaultValue);
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}
