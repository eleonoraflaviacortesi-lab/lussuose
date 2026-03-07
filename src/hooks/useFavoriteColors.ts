import { useState, useCallback } from 'react';
import { getLS, setLS } from '@/lib/localStorage';

const STORAGE_KEY = 'favorite-colors';
const MAX_FAVORITES = 8;

export const useFavoriteColors = () => {
  const [favorites, setFavorites] = useState<string[]>(() => getLS<string[]>(STORAGE_KEY, []));

  const addFavorite = useCallback((color: string) => {
    setFavorites(prev => {
      if (prev.includes(color)) return prev;
      const next = [color, ...prev].slice(0, MAX_FAVORITES);
      setLS(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((color: string) => {
    setFavorites(prev => {
      const next = prev.filter(c => c !== color);
      setLS(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { favorites, addFavorite, removeFavorite };
};
