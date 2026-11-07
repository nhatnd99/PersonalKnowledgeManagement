import { useState, useEffect, useCallback } from 'react';
import { relationshipService } from '../services/relationshipService.js';

/**
 * Hook to manage knowledge relationships and backlinks for a note.
 *
 * @param {string} noteId - Active Note UUID
 */
export function useRelationships(noteId) {
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRelationships = useCallback(async () => {
    if (!noteId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await relationshipService.getNoteRelationships(noteId, { direction: 'both' });
      setOutgoing(data.outgoing || []);
      setIncoming(data.incoming || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load relationships');
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const addRelationship = async ({ targetNoteId, relationshipType, description }) => {
    try {
      const created = await relationshipService.createRelationship({
        sourceNoteId: noteId,
        targetNoteId,
        relationshipType,
        description,
      });
      setOutgoing((prev) => [created, ...prev]);
      return { success: true, data: created };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create relationship';
      return { success: false, error: msg };
    }
  };

  const removeRelationship = async (relationshipId) => {
    try {
      await relationshipService.deleteRelationship(relationshipId);
      setOutgoing((prev) => prev.filter((rel) => rel.id !== relationshipId));
      setIncoming((prev) => prev.filter((rel) => rel.id !== relationshipId));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete relationship';
      return { success: false, error: msg };
    }
  };

  return {
    outgoing,
    incoming,
    isLoading,
    error,
    addRelationship,
    removeRelationship,
    refetch: fetchRelationships,
  };
}
