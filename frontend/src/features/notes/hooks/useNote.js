import { useState, useEffect, useCallback } from 'react';
import * as noteService from '../services/noteService.js';

/**
 * Hook to manage fetching, updating, and local state of a single note.
 * Separates document state from metadata updates to prevent cursor jumps and selection loss.
 *
 * @param {string} noteId - Note UUID
 * @returns {Object} { note, isLoading, error, saveNote, refetch }
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

  const saveNote = useCallback(
    async (updates, targetId = noteId) => {
      const idToSave = targetId || noteId;
      if (!idToSave) return null;

      try {
        const response = await noteService.updateNote(idToSave, updates);

        // Update local note metadata without overwriting active editor content
        setNote((prev) => {
          if (!prev || prev.id !== idToSave) return prev;
          return {
            ...prev,
            title: updates.title !== undefined ? updates.title : prev.title,
            isFavorite: updates.isFavorite !== undefined ? updates.isFavorite : prev.isFavorite,
            updatedAt: response.data?.updatedAt || prev.updatedAt,
          };
        });

        // Notify other components (sidebar hierarchy tree, breadcrumbs) of title update
        if (updates.title !== undefined) {
          window.dispatchEvent(
            new CustomEvent('note:updated', {
              detail: { id: idToSave, title: updates.title },
            })
          );
        }

        return response.data;
      } catch (err) {
        setError(err.message || 'Failed to save note');
        throw err;
      }
    },
    [noteId]
  );

  return {
    note,
    isLoading,
    error,
    saveNote,
    refetch: fetchNote,
  };
}
