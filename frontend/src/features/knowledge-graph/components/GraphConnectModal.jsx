import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Network, AlertCircle, ArrowRight } from 'lucide-react';
import { relationshipService } from '../../relationships/services/relationshipService.js';

const RELATIONSHIP_TYPES = [
  { value: 'RELATED_TO', label: 'Related to', description: 'General association' },
  { value: 'DEPENDS_ON', label: 'Depends on', description: 'Requires this note or concept' },
  { value: 'REFERENCES', label: 'References', description: 'Cites or mentions' },
  { value: 'EXTENDS', label: 'Extends', description: 'Expands or elaborates upon' },
  { value: 'CONTRADICTS', label: 'Contradicts', description: 'Conflicting or opposing viewpoint' },
];

/**
 * Modal dialog for establishing a directional knowledge relationship between nodes
 * (supports Note-to-Note, Note-to-Folder, Folder-to-Note).
 */
export function GraphConnectModal({
  isOpen,
  onClose,
  sourceNode,
  availableNodes = [],
  onSuccess,
}) {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relationshipType, setRelationshipType] = useState('RELATED_TO');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setDescription('');

    const initialSourceId = sourceNode?.id || (availableNodes[0]?.id || '');
    setSourceId(initialSourceId);

    const availableTargets = availableNodes.filter((n) => n.id !== initialSourceId);
    setTargetId(availableTargets[0]?.id || '');
  }, [isOpen, sourceNode, availableNodes]);

  if (!isOpen) return null;

  const validTargets = availableNodes.filter((n) => n.id !== sourceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceId || !targetId) {
      setError('Please select both a source and target item');
      return;
    }

    if (sourceId === targetId) {
      setError('An item cannot create a relationship with itself');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await relationshipService.createRelationship({
        sourceNoteId: sourceId,
        targetNoteId: targetId,
        relationshipType,
        description: description.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Create Knowledge Connection</h3>
              <p className="text-[11px] text-muted-foreground">
                Connect notes and folders with a directional semantic relationship
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Source Item */}
          <div>
            <label htmlFor="source-node-select" className="block font-medium text-foreground mb-1">
              Source Item (From)
            </label>
            <select
              id="source-node-select"
              value={sourceId}
              onChange={(e) => {
                const newSourceId = e.target.value;
                setSourceId(newSourceId);
                if (targetId === newSourceId) {
                  const altTarget = availableNodes.find((n) => n.id !== newSourceId);
                  setTargetId(altTarget ? altTarget.id : '');
                }
              }}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {availableNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.type === 'FOLDER' ? '📁 [Folder] ' : '📄 [Note] '}
                  {n.title || 'Untitled'}
                </option>
              ))}
            </select>
          </div>

          {/* Target Item */}
          <div>
            <label htmlFor="target-node-select" className="block font-medium text-foreground mb-1">
              Target Item (To)
            </label>
            <select
              id="target-node-select"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {validTargets.length === 0 ? (
                <option value="">No other items available</option>
              ) : (
                validTargets.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.type === 'FOLDER' ? '📁 [Folder] ' : '📄 [Note] '}
                    {n.title || 'Untitled'}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Relationship Type */}
          <div>
            <label htmlFor="connect-relationship-type" className="block font-medium text-foreground mb-1">
              Relationship Type
            </label>
            <select
              id="connect-relationship-type"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {RELATIONSHIP_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} &mdash; {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Context Note / Description */}
          <div>
            <label htmlFor="connect-relationship-description" className="block font-medium text-foreground mb-1">
              Description / Context Note (optional)
            </label>
            <textarea
              id="connect-relationship-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why are these items connected?"
              rows={2}
              maxLength={1000}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !sourceId || !targetId}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              <span>{isSubmitting ? 'Connecting...' : 'Create Connection'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

GraphConnectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sourceNode: PropTypes.object,
  availableNodes: PropTypes.array,
  onSuccess: PropTypes.func.isRequired,
};
