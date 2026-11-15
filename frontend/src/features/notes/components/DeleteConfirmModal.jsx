import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  Folder,
  FileText,
  Network,
  RefreshCw,
  X,
  Trash2,
  AlertCircle,
  FolderTree,
} from 'lucide-react';
import { getDeletePreview, deleteNote } from '../services/noteService.js';

/**
 * Enhanced Cascade Delete Confirmation Modal.
 * Displays exact counts of descendant folders, descendant notes, and affected semantic relationships
 * before requiring explicit confirmation to permanently delete.
 */
export function DeleteConfirmModal({
  isOpen,
  onClose,
  noteId,
  initialTarget,
  onDeleted,
}) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!isOpen || !noteId) {
      setPreview(null);
      setError(null);
      setDeleting(false);
      return;
    }

    setLoading(true);
    setError(null);

    getDeletePreview(noteId)
      .then((res) => {
        setPreview(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to calculate deletion metrics');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, noteId]);

  if (!isOpen) return null;

  const target = preview?.target || initialTarget || { title: 'Untitled', type: 'NOTE' };
  const isFolder = target.type === 'FOLDER';
  const descendants = preview?.descendants || { folders: 0, notes: 0, total: 0 };
  const affectedRelationships = preview?.affectedRelationships || 0;

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);

    try {
      await deleteNote(noteId, true);
      onClose();
      if (onDeleted) {
        onDeleted(target);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete entity');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-4 sm:p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Delete {isFolder ? 'Folder' : 'Note'} Permanently?
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Cascade hierarchy deletion and relationship cleanup
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">{error}</div>
          </div>
        )}

        {/* Body Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span>Calculating affected content and relationships...</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Target Item Name Banner */}
            <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-2.5">
              {isFolder ? (
                <Folder className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-primary shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Target {isFolder ? 'Folder' : 'Note'}
                </span>
                <span className="font-semibold text-foreground text-xs truncate block">
                  {target.title || (isFolder ? 'Untitled Folder' : 'Untitled Note')}
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border bg-card p-2.5 text-center">
                <FolderTree className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <span className="block font-bold text-sm text-foreground">
                  {descendants.folders}
                </span>
                <span className="text-[10px] text-muted-foreground">Subfolders</span>
              </div>

              <div className="rounded-xl border border-border bg-card p-2.5 text-center">
                <FileText className="h-4 w-4 text-primary mx-auto mb-1" />
                <span className="block font-bold text-sm text-foreground">
                  {descendants.notes}
                </span>
                <span className="text-[10px] text-muted-foreground">Child Notes</span>
              </div>

              <div className="rounded-xl border border-border bg-card p-2.5 text-center">
                <Network className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                <span className="block font-bold text-sm text-foreground">
                  {affectedRelationships}
                </span>
                <span className="text-[10px] text-muted-foreground">Connections</span>
              </div>
            </div>

            {/* Warning Notices */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-1.5 text-[11px] text-foreground/90">
              <p className="font-medium text-destructive flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Permanent Deletion Warning:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                {isFolder ? (
                  <>
                    <li>
                      This folder and all <strong>{descendants.total}</strong> nested subfolders and notes will be permanently deleted.
                    </li>
                    {affectedRelationships > 0 && (
                      <li>
                        All <strong>{affectedRelationships}</strong> knowledge connections linked to any of these entities will be cleanly removed.
                      </li>
                    )}
                  </>
                ) : (
                  <>
                    <li>
                      This note{descendants.notes > 0 ? ` and its ${descendants.notes} nested child note(s)` : ''} will be permanently deleted.
                    </li>
                    {affectedRelationships > 0 && (
                      <li>
                        All <strong>{affectedRelationships}</strong> knowledge graph relationships involving {descendants.notes > 0 ? 'these notes' : 'this note'} will be removed.
                      </li>
                    )}
                  </>
                )}
                <li>
                  Unrelated notes and folders outside this hierarchy will be <strong>strictly preserved</strong>.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground hover:bg-muted font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || deleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

DeleteConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  noteId: PropTypes.string,
  initialTarget: PropTypes.object,
  onDeleted: PropTypes.func,
};
