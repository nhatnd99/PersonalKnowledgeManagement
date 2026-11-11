import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getNotes } from '../../services/noteService.js';
import { X, Search, FileText, Folder, Link, AlertCircle } from 'lucide-react';

/**
 * Dialog allowing users to search and select an internal note to link to.
 */
export function InternalNoteLinkDialog({ editor, isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    setIsLoading(true);
    setError(null);

    getNotes({ limit: 100 })
      .then((res) => {
        setNotes(res.data || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch notes');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen]);

  if (!isOpen || !editor) return null;

  const filteredNotes = notes.filter((n) =>
    (n.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectNote = (targetNote) => {
    const { empty } = editor.state.selection;

    if (empty) {
      // No text selected: insert title as linked text
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: targetNote.title || 'Untitled Note',
          marks: [
            {
              type: 'internalNoteLink',
              attrs: {
                noteId: targetNote.id,
                noteTitle: targetNote.title || 'Untitled Note',
              },
            },
          ],
        })
        .run();
    } else {
      // Selected text: apply internalNoteLink mark over current selection
      editor
        .chain()
        .focus()
        .setInternalNoteLink({
          noteId: targetNote.id,
          noteTitle: targetNote.title || 'Untitled Note',
        })
        .run();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Link className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Link to Internal Note</h3>
              <p className="text-[11px] text-muted-foreground">
                Select a note from your knowledge base
              </p>
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

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title..."
            autoFocus
            className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No matching notes found.
            </div>
          ) : (
            filteredNotes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleSelectNote(n)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left hover:bg-muted/70 transition-colors text-xs group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {n.type === 'FOLDER' ? (
                    <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <span className="font-medium text-foreground truncate">{n.title || 'Untitled'}</span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  Link
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

InternalNoteLinkDialog.propTypes = {
  editor: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
