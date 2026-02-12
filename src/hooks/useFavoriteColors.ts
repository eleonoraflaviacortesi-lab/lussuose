import { useState, useCallback } from 'react';

const STORAGE_KEY = 'favorite-colors';
const MAX_FAVORITES = 8;

const loadFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (colors: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
};

export const useFavoriteColors = () => {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  const addFavorite = useCallback((color: string) => {
    setFavorites(prev => {
      if (prev.includes(color)) return prev;
      const next = [color, ...prev].slice(0, MAX_FAVORITES);
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((color: string) => {
    setFavorites(prev => {
      const next = prev.filter(c => c !== color);
      saveFavorites(next);
      return next;
    });
  }, []);

  return { favorites, addFavorite, removeFavorite };
};
