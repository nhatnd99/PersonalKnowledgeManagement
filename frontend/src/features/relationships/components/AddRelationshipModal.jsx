import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getNotes } from '../../notes/services/noteService.js';
import { X, Plus, AlertCircle } from 'lucide-react';

const RELATIONSHIP_TYPES = [
  { value: 'RELATED_TO', label: 'Related to', description: 'General association' },
  { value: 'DEPENDS_ON', label: 'Depends on', description: 'Requires this note/concept' },
  { value: 'REFERENCES', label: 'References', description: 'Cites or mentions' },
  { value: 'EXTENDS', label: 'Extends', description: 'Expands or elaborates upon' },
  { value: 'CONTRADICTS', label: 'Contradicts', description: 'Conflicting or opposing viewpoint' },
];

/**
 * Modal dialog for creating a directional relationship from the current note.
 */
export function AddRelationshipModal({ isOpen, onClose, currentNoteId, onAdd }) {
  const [availableNotes, setAvailableNotes] = useState([]);
  const [targetNoteId, setTargetNoteId] = useState('');
  const [relationshipType, setRelationshipType] = useState('RELATED_TO');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setDescription('');
    setTargetNoteId('');

    // Fetch existing notes excluding current note
    getNotes({ limit: 100 })
      .then((res) => {
        const notes = (res.data || []).filter((n) => n.id !== currentNoteId);
        setAvailableNotes(notes);
        if (notes.length > 0) {
          setTargetNoteId(notes[0].id);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load notes');
      });
  }, [isOpen, currentNoteId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetNoteId) {
      setError('Please select a target note');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await onAdd({
      targetNoteId,
      relationshipType,
      description: description.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Add Knowledge Connection</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="target-note-select" className="block text-xs font-medium text-foreground mb-1">
              Connect to Note
            </label>
            <select
              id="target-note-select"
              value={targetNoteId}
              onChange={(e) => setTargetNoteId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {availableNotes.length === 0 ? (
                <option value="">No other notes available</option>
              ) : (
                availableNotes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title || 'Untitled Note'} ({note.type})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="relationship-type-select" className="block text-xs font-medium text-foreground mb-1">
              Relationship Type
            </label>
            <select
              id="relationship-type-select"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {RELATIONSHIP_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} &mdash; {type.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="relationship-description-input" className="block text-xs font-medium text-foreground mb-1">
              Context Note / Description (optional)
            </label>
            <textarea
              id="relationship-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why are these notes connected?"
              rows={3}
              maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableNotes.length === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Connecting...' : 'Connect Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddRelationshipModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentNoteId: PropTypes.string.isRequired,
  onAdd: PropTypes.func.isRequired,
};
