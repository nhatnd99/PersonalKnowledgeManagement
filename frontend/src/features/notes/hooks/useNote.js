import { useState, useEffect, useCallback } from 'react';
import * as noteService from '../services/noteService.js';

/**
 * Hook to manage fetching, updating, and local state of a single note.
 * @param {string} noteId - Note UUID
 * @returns {Object}
 */
export function useNote(noteId) {
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(noteId));
  const [error, setError] = useState(null);

  const fetchNote = useCallback(async () => {
    if (!noteId) {
      setNote(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await noteService.getNoteById(noteId);
      setNote(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load note');
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const saveNote = useCallback(async (updates) => {
    if (!noteId) return null;
    try {
      const response = await noteService.updateNote(noteId, updates);
      setNote(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to save note');
      throw err;
    }
  }, [noteId]);

  return {
    note,
    isLoading,
    error,
    saveNote,
    refetch: fetchNote,
  };
}
