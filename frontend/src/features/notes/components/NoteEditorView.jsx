import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNote } from '../hooks/useNote.js';
import { useAutoSave } from '../hooks/useAutoSave.js';
import { useRelationships } from '../../relationships/hooks/useRelationships.js';
import { NoteEditor } from '../components/NoteEditor.jsx';
import { AutoSaveIndicator } from '../components/AutoSaveIndicator.jsx';
import { Breadcrumbs } from '../../hierarchy/components/Breadcrumbs.jsx';
import { RelationshipsPanel } from '../../relationships/components/RelationshipsPanel.jsx';
import { BacklinksPanel } from '../../backlinks/components/BacklinksPanel.jsx';
import { ConnectionsDrawer } from '../../connections/components/ConnectionsDrawer.jsx';
import { NoteTagsSelector } from '../../tags/components/NoteTagsSelector.jsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.jsx';
import { MobileNotesList } from '../components/MobileNotesList.jsx';
import { exportNote } from '../services/noteService.js';
import { Star, FileText, Share2, Download, Trash2, ArrowLeft } from 'lucide-react';

/**
 * NoteEditorView: Workspace page displaying note header, editable title,
 * auto-save status indicator, TipTap ProseMirror rich text surface,
 * and knowledge graph connections & backlinks panel.
 */
export function NoteEditorView() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { note, isLoading, error, saveNote, refetch: refetchNote } = useNote(noteId);
  const {
    outgoing,
    incoming,
    addRelationship,
    removeRelationship,
    refetch: refetchRelationships,
  } = useRelationships(noteId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const activeNoteIdRef = useRef(noteId);
  const loadedNoteIdRef = useRef(null);
  const lastSavedTitleRef = useRef('');
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  // Auto-save hook saving to the exact note ID that generated the edits
  const { status, lastSavedAt, triggerSave, flushSave, retrySave, cancelSave } = useAutoSave(
    async (data) => {
      const targetId = activeNoteIdRef.current;
      if (targetId) {
        const updated = await saveNote(data, targetId);
        if (data.title !== undefined && targetId === activeNoteIdRef.current) {
          lastSavedTitleRef.current = updated?.title ?? data.title;
        }
      }
    },
    600
  );

  // Sync state when loaded note changes or navigation to different note occurs
  useEffect(() => {
    if (note && note.id === noteId && note.id !== loadedNoteIdRef.current) {
      loadedNoteIdRef.current = note.id;
      activeNoteIdRef.current = note.id;
      const initialTitle = note.title || '';
      setTitle(initialTitle);
      titleRef.current = initialTitle;
      lastSavedTitleRef.current = initialTitle;
      setContent(note.content || null);
      contentRef.current = note.content || null;
    }
  }, [note, noteId]);

  // Flush any pending save on navigation or unmount, and clean up for new note
  useEffect(() => {
    activeNoteIdRef.current = noteId;
    return () => {
      flushSave();
      cancelSave();
      loadedNoteIdRef.current = null;
      setTitle('');
      titleRef.current = '';
      lastSavedTitleRef.current = '';
    };
  }, [noteId, flushSave, cancelSave]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    titleRef.current = newTitle;

    // Trigger auto-save only if the title actually changed from last saved title
    if (newTitle !== lastSavedTitleRef.current) {
      triggerSave({ title: newTitle });
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus into the rich text editor surface
      const editorEl = document.querySelector('.ProseMirror');
      if (editorEl) {
        editorEl.focus();
      }
    }
  };

  const handleContentChange = useCallback(
    (newContentJson) => {
      contentRef.current = newContentJson;
      triggerSave({ content: newContentJson });
    },
    [triggerSave]
  );

  const handleToggleFavorite = async () => {
    if (!note) return;
    await saveNote({ isFavorite: !note.isFavorite });
  };

  const handleExport = async (format) => {
    if (!note) return;
    try {
      const data = await exportNote(note.id, format);
      let fileContent;
      let filename;
      let mime;
      if (format === 'json') {
        fileContent = JSON.stringify(data, null, 2);
        filename = `${(note.title || 'note').replace(/[/\\?%*:|"<>]/g, '_')}.json`;
        mime = 'application/json';
      } else {
        fileContent = data.markdown;
        filename = data.filename;
        mime = 'text/markdown;charset=utf-8';
      }
      const blob = new Blob([fileContent], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export note');
    }
  };

  if (!noteId) {
    return <MobileNotesList />;
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Loading note...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-destructive gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => navigate('/notes')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground text-xs hover:bg-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Notes</span>
        </button>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <FileText className="h-10 w-10 stroke-[1.5] mb-2 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold text-foreground">Note Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
          This note may have been deleted, moved, or the link is invalid.
        </p>
        <button
          type="button"
          onClick={() => navigate('/notes')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Notes</span>
        </button>
      </div>
    );
  }

  const totalConnections = outgoing.length + incoming.length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Note Canvas */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Top note metadata bar & Breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/notes')}
                className="md:hidden inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                aria-label="Back to notes list"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Notes</span>
              </button>
              <div className="truncate">
                <Breadcrumbs note={note} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <AutoSaveIndicator
                status={status}
                lastSavedAt={lastSavedAt}
                onRetry={retrySave}
              />

              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label="Toggle Favorite"
                className={`p-1.5 rounded-md hover:bg-muted transition-colors ${
                  note.isFavorite ? 'text-amber-500' : 'text-muted-foreground'
                }`}
              >
                <Star className={`h-4 w-4 ${note.isFavorite ? 'fill-amber-500' : ''}`} />
              </button>

              {/* Export Button */}
              <button
                type="button"
                onClick={() => handleExport('markdown')}
                title="Export as Markdown (.md)"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                title="Delete note"
                aria-label="Delete note"
                className="inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 text-xs font-medium rounded-md border border-destructive/20 hover:border-destructive/40 bg-background hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSidePanel(true)}
                title="Open Connections Drawer"
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                  showSidePanel
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Connections</span>
                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-foreground">
                  {totalConnections}
                </span>
              </button>
            </div>
          </div>

          {/* Note Title Input */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled Note"
            maxLength={500}
            className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 mb-3 px-1 py-1 rounded-md focus:bg-muted/20 focus:ring-1 focus:ring-primary/30 transition-colors"
            aria-label="Note title"
          />

          {/* Interactive Tag Chips Bar */}
          <div className="mb-6">
            <NoteTagsSelector noteId={note.id} initialTags={note.tags || []} />
          </div>

          {/* TipTap Rich Text Editor */}
          <NoteEditor
            key={note.id}
            initialContent={note.content}
            onChange={handleContentChange}
          />

          {/* Bottom Connections & Backlinks Section (Obsidian-style footer) */}
          <div className="mt-16 pt-8 border-t border-border space-y-8">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              <span>Knowledge Connections & Backlinks</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RelationshipsPanel
                currentNoteId={note.id}
                outgoing={outgoing}
                onAddRelationship={addRelationship}
                onDeleteRelationship={removeRelationship}
              />

              <BacklinksPanel
                incoming={incoming}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Unified Connections Drawer */}
      <ConnectionsDrawer
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        itemId={note.id}
        item={note}
        onItemUpdated={() => {
          refetchNote();
          refetchRelationships();
        }}
      />

      {/* Cascade Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        noteId={note.id}
        initialTarget={note}
        onDeleted={() => {
          navigate('/notes');
        }}
      />
    </div>
  );
}
