import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Star,
  FileText,
  Folder,
  Calendar,
  Sparkles,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import * as noteService from '../services/noteService.js';
import { extractTextPreview } from '../utils/contentPreview.js';
import { DeleteConfirmModal } from './DeleteConfirmModal.jsx';
import { NOTE_TYPES } from '../../../constants/index.js';

/**
 * MobileNotesList: Responsive vertical card list for browsing and managing notes on mobile/tablet.
 * Displayed when no note is active, providing search, filters, quick actions, and a FAB.
 */
export function MobileNotesList() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'FAVORITES' | 'FOLDERS'
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await noteService.getNotes({ limit: 100 });
      setNotes(res.data || res.notes || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateNote = async (type = NOTE_TYPES.NOTE) => {
    try {
      const title = type === NOTE_TYPES.FOLDER ? 'New Folder' : 'Untitled Note';
      const res = await noteService.createNote({
        title,
        type,
        content: null,
      });
      if (res.data?.id) {
        if (type === NOTE_TYPES.NOTE) {
          navigate(`/notes/${res.data.id}`);
        } else {
          loadNotes();
        }
      }
    } catch (err) {
      alert(`Could not create item: ${err.message}`);
    }
  };

  const handleToggleFavorite = async (e, note) => {
    e.stopPropagation();
    try {
      await noteService.updateNote(note.id, { isFavorite: !note.isFavorite });
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, isFavorite: !n.isFavorite } : n))
      );
    } catch {
      // Non-blocking
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Filter by type / favorite
      if (activeFilter === 'FAVORITES' && !n.isFavorite) return false;
      if (activeFilter === 'FOLDERS' && n.type !== NOTE_TYPES.FOLDER) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (n.title || '').toLowerCase().includes(q);
        const matchesTags = (n.tags || []).some((t) =>
          (t.tag?.name || '').toLowerCase().includes(q)
        );
        return matchesTitle || matchesTags;
      }
      return true;
    });
  }, [notes, activeFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-background px-4 py-5 max-w-2xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">All Notes</h1>
          <p className="text-xs text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'item' : 'items'} in knowledge base
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleCreateNote(NOTE_TYPES.NOTE)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes and tags..."
          className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeFilter === 'ALL'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/70 text-muted-foreground hover:bg-muted'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('FAVORITES')}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeFilter === 'FAVORITES'
              ? 'bg-amber-500 text-white'
              : 'bg-muted/70 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Star className="h-3 w-3 fill-current" />
          <span>Favorites</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('FOLDERS')}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeFilter === 'FOLDERS'
              ? 'bg-amber-600 text-white'
              : 'bg-muted/70 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Folder className="h-3 w-3" />
          <span>Folders</span>
        </button>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-16">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading notes...</div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs text-center">
            {error}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-border p-8">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground">No notes found</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {searchQuery ? 'Try a different search term or filter.' : 'Create your first note to begin.'}
            </p>
            <button
              type="button"
              onClick={() => handleCreateNote(NOTE_TYPES.NOTE)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Note</span>
            </button>
          </div>
        ) : (
          filteredNotes.map((item) => {
            const isFolder = item.type === NOTE_TYPES.FOLDER;
            const preview = extractTextPreview(item.content, 90);
            const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '';

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isFolder) {
                    navigate(`/graph/folders/${item.id}`);
                  } else {
                    navigate(`/notes/${item.id}`);
                  }
                }}
                className="group relative flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer select-none active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isFolder ? (
                      <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <h3 className="font-semibold text-xs text-foreground truncate">
                      {item.title || 'Untitled'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, item)}
                      aria-label="Toggle Favorite"
                      className="p-1 rounded text-muted-foreground hover:text-amber-500"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          item.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      aria-label="Delete Item"
                      className="p-1 rounded text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {preview && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {preview}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{dateStr}</span>
                  </span>

                  <span className="flex items-center gap-0.5 text-primary font-medium">
                    <span>Open</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => handleCreateNote(NOTE_TYPES.NOTE)}
        aria-label="Create New Note"
        className="fixed bottom-20 right-4 z-20 md:hidden flex h-13 w-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        noteId={deleteTarget?.id}
        initialTarget={deleteTarget}
        onDeleted={loadNotes}
      />
    </div>
  );
}
