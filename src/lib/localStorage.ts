/**
 * Safe localStorage helpers with JSON serialization and try/catch.
 * Use these in plain functions; use useLocalStorage hook in React components.
 */

export function getLS<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLS<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function removeLS(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Read raw string (no JSON parsing). */
export function getLSRaw(key: string, defaultValue: string = ''): string {
  try {
    return localStorage.getItem(key) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/** Write raw string (no JSON serialization). */
export function setLSRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
