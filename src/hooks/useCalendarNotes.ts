import { useState, useEffect, useCallback } from 'react';

// Key for localStorage
const STORAGE_KEY = 'calendar_event_notes';

type CalendarNotes = Record<string, string>;

export const useCalendarNotes = () => {
  const [notes, setNotes] = useState<CalendarNotes>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist to localStorage when notes change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save calendar notes:', e);
    }
  }, [notes]);

  const getNote = useCallback((eventId: string): string | undefined => {
    return notes[eventId];
  }, [notes]);

  const setNote = useCallback((eventId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [eventId]: note,
    }));
  }, []);

  const deleteNote = useCallback((eventId: string) => {
    setNotes(prev => {
      const updated = { ...prev };
      delete updated[eventId];
      return updated;
    });
  }, []);

  const hasNote = useCallback((eventId: string): boolean => {
    return !!notes[eventId];
  }, [notes]);

  return {
    notes,
    getNote,
    setNote,
    deleteNote,
    hasNote,
  };
};
