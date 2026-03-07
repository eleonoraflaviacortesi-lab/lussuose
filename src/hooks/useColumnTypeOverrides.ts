import { useState, useCallback } from 'react';
import { getLS, setLS } from '@/lib/localStorage';

export type ColumnTypeOverride = 'text' | 'dropdown' | 'url' | 'checkbox';

const STORAGE_KEY_PREFIX = 'col-type-overrides-';

export function useColumnTypeOverrides(sheetId: string) {
  const [overrides, setOverrides] = useState<Record<string, ColumnTypeOverride>>(
    () => getLS<Record<string, ColumnTypeOverride>>(STORAGE_KEY_PREFIX + sheetId, {})
  );

  const setColumnType = useCallback((colKey: string, type: ColumnTypeOverride | null) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (type === null) {
        delete next[colKey];
      } else {
        next[colKey] = type;
      }
      setLS(STORAGE_KEY_PREFIX + sheetId, next);
      return next;
    });
  }, [sheetId]);

  const getColumnType = useCallback((colKey: string): ColumnTypeOverride | null => {
    return overrides[colKey] ?? null;
  }, [overrides]);

  return { overrides, setColumnType, getColumnType };
}
