import { useState, useCallback } from 'react';

export type ColumnTypeOverride = 'text' | 'dropdown' | 'url' | 'checkbox';

const STORAGE_KEY_PREFIX = 'col-type-overrides-';

function loadOverrides(sheetId: string): Record<string, ColumnTypeOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + sheetId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(sheetId: string, overrides: Record<string, ColumnTypeOverride>) {
  localStorage.setItem(STORAGE_KEY_PREFIX + sheetId, JSON.stringify(overrides));
}

export function useColumnTypeOverrides(sheetId: string) {
  const [overrides, setOverrides] = useState<Record<string, ColumnTypeOverride>>(
    () => loadOverrides(sheetId)
  );

  const setColumnType = useCallback((colKey: string, type: ColumnTypeOverride | null) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (type === null) {
        delete next[colKey];
      } else {
        next[colKey] = type;
      }
      saveOverrides(sheetId, next);
      return next;
    });
  }, [sheetId]);

  const getColumnType = useCallback((colKey: string): ColumnTypeOverride | null => {
    return overrides[colKey] ?? null;
  }, [overrides]);

  return { overrides, setColumnType, getColumnType };
}
