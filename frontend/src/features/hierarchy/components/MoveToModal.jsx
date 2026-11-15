import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Folder, FolderTree, Home, ArrowRight, Check } from 'lucide-react';
import { graphService } from '../../knowledge-graph/services/graphService.js';

/**
 * Touch-friendly Move To Dialog for mobile and tablet users.
 * Allows moving notes or folders to Root or any destination folder without drag-and-drop.
 */
export function MoveToModal({ isOpen, onClose, targetNode, onMove }) {
  const [folders, setFolders] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState('ROOT');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !targetNode) return;
    setError(null);
    setIsLoading(true);
    setSelectedParentId(targetNode.parentId || 'ROOT');

    graphService
      .getFoldersList()
      .then((res) => {
        // Exclude self and descendants to avoid circular hierarchy
        const valid = (res.folders || []).filter((f) => f.id !== targetNode.id);
        setFolders(valid);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load folders');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, targetNode]);

  if (!isOpen || !targetNode) return null;

  const handleConfirmMove = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const newParentId = selectedParentId === 'ROOT' ? null : selectedParentId;
      await onMove(targetNode.id, newParentId);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to move note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-foreground">
                Move &quot;{targetNode.title || 'Item'}&quot;
              </h3>
              <p className="text-[10px] text-muted-foreground">Select destination folder</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 mb-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            {error}
          </div>
        )}

        {/* Folder Selection List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 py-1 pr-1 text-xs">
          {/* Root Option */}
          <button
            type="button"
            onClick={() => setSelectedParentId('ROOT')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
              selectedParentId === 'ROOT'
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-border bg-background hover:bg-muted text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              <span>Root Workspace</span>
            </div>
            {selectedParentId === 'ROOT' && <Check className="h-4 w-4 text-primary" />}
          </button>

          {isLoading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">Loading folders...</div>
          ) : (
            folders.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedParentId(f.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                  selectedParentId === f.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'border-border bg-background hover:bg-muted text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="truncate">{f.title}</span>
                </div>
                {selectedParentId === f.id && <Check className="h-4 w-4 text-amber-500 shrink-0" />}
              </button>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmMove}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            <span>Move</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

MoveToModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  targetNode: PropTypes.object,
  onMove: PropTypes.func.isRequired,
};
