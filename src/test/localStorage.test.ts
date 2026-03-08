import { describe, it, expect, beforeEach } from 'vitest';
import { getLS, setLS, removeLS, getLSRaw, setLSRaw } from '@/lib/localStorage';

beforeEach(() => localStorage.clear());

describe('getLS', () => {
  it('returns default when key is missing', () => {
    expect(getLS('missing', 42)).toBe(42);
  });

  it('returns parsed value when key exists', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }));
    expect(getLS('k', {})).toEqual({ a: 1 });
  });

  it('returns default on invalid JSON', () => {
    localStorage.setItem('bad', '{broken');
    expect(getLS('bad', 'fallback')).toBe('fallback');
  });
});

describe('setLS', () => {
  it('serializes and stores value', () => {
    setLS('arr', [1, 2, 3]);
    expect(localStorage.getItem('arr')).toBe('[1,2,3]');
  });
});

describe('removeLS', () => {
  it('deletes the key', () => {
    localStorage.setItem('x', '"val"');
    removeLS('x');
    expect(localStorage.getItem('x')).toBeNull();
  });
});

describe('getLSRaw / setLSRaw', () => {
  it('stores and retrieves raw strings without JSON', () => {
    setLSRaw('raw', 'hello');
    expect(getLSRaw('raw')).toBe('hello');
  });

  it('returns default for missing key', () => {
    expect(getLSRaw('nope', 'def')).toBe('def');
  });
});
