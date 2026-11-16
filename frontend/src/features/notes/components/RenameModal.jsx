import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X, Edit2, Folder, FileText, Loader2 } from 'lucide-react';
import * as noteService from '../services/noteService.js';
import { NOTE_TYPES } from '../../../constants/index.js';

/**
 * Reusable modal for renaming Notes and Folders from Graph, Hierarchy, or Lists.
 */
export function RenameModal({ isOpen, onClose, target, onRenamed }) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && target) {
      setTitle(target.title || '');
      setError(null);
      setIsSubmitting(false);
      // Auto-focus and select text
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, target]);

  if (!isOpen || !target) return null;

  const isFolder = target.type === NOTE_TYPES.FOLDER;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title cannot be empty');
      return;
    }

    if (trimmedTitle === target.title) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await noteService.updateNote(target.id, { title: trimmedTitle });
      if (onRenamed) {
        onRenamed(res.data || { ...target, title: trimmedTitle });
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to rename item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isFolder ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
              {isFolder ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-xs text-foreground">
                Rename {isFolder ? 'Folder' : 'Note'}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Enter a new name for this item
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 mb-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rename-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
              Title
            </label>
            <div className="relative">
              <input
                id="rename-input"
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder={isFolder ? 'Folder name...' : 'Note title...'}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
              />
              <Edit2 className="absolute right-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

RenameModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  target: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
  }),
  onRenamed: PropTypes.func,
};
