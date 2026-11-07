import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNote } from '../hooks/useNote.js';
import { useAutoSave } from '../hooks/useAutoSave.js';
import { useRelationships } from '../../relationships/hooks/useRelationships.js';
import { NoteEditor } from '../components/NoteEditor.jsx';
import { AutoSaveIndicator } from '../components/AutoSaveIndicator.jsx';
import { Breadcrumbs } from '../../hierarchy/components/Breadcrumbs.jsx';
import { RelationshipsPanel } from '../../relationships/components/RelationshipsPanel.jsx';
import { BacklinksPanel } from '../../backlinks/components/BacklinksPanel.jsx';
import { NoteTagsSelector } from '../../tags/components/NoteTagsSelector.jsx';
import { exportNote } from '../services/noteService.js';
import { Star, FileText, Share2, PanelRightClose, PanelRightOpen, Download } from 'lucide-react';

/**
 * NoteEditorView: Workspace page displaying note header, editable title,
 * auto-save status indicator, TipTap ProseMirror rich text surface,
 * and knowledge graph connections & backlinks panel.
 */
export function NoteEditorView() {
  const { noteId } = useParams();
  const { note, isLoading, error, saveNote } = useNote(noteId);
  const {
    outgoing,
    incoming,
    addRelationship,
    removeRelationship,
  } = useRelationships(noteId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);

  // Auto-save hook
  const { status, lastSavedAt, triggerSave } = useAutoSave(async (data) => {
    await saveNote(data);
  });

  // Sync state when loaded note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || null);
    }
  }, [note]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerSave({ title: newTitle, content });
  };

  const handleContentChange = (newContentJson) => {
    setContent(newContentJson);
    triggerSave({ title, content: newContentJson });
  };

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Loading note...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <FileText className="h-10 w-10 stroke-[1.5] mb-2 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold text-foreground">No Note Selected</h2>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Select an existing note from the sidebar or click &quot;New Note&quot; to create one.
        </p>
      </div>
    );
  }

  const totalConnections = outgoing.length + incoming.length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Note Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Top note metadata bar & Breadcrumbs */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <Breadcrumbs note={note} />

            <div className="flex items-center gap-3">
              <AutoSaveIndicator status={status} lastSavedAt={lastSavedAt} />

              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label="Toggle Favorite"
                className={`p-1.5 rounded hover:bg-muted transition-colors ${
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
                <span>Export MD</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSidePanel(!showSidePanel)}
                title="Toggle Graph Connections"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                  showSidePanel
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Connections</span>
                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-foreground">
                  {totalConnections}
                </span>
                {showSidePanel ? (
                  <PanelRightClose className="h-3.5 w-3.5 ml-0.5" />
                ) : (
                  <PanelRightOpen className="h-3.5 w-3.5 ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Note Title Input */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 mb-3"
          />

          {/* Interactive Tag Chips Bar */}
          <div className="mb-6">
            <NoteTagsSelector noteId={note.id} initialTags={note.tags || []} />
          </div>

          {/* TipTap Rich Text Editor */}
          <NoteEditor
            initialContent={content}
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

      {/* Side Panel for Quick Connections Navigation */}
      {showSidePanel && (
        <aside className="w-80 border-l border-border bg-card overflow-y-auto p-4 space-y-6 shrink-0 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-primary" />
              <span>Connections Drawer</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowSidePanel(false)}
              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>

          <RelationshipsPanel
            currentNoteId={note.id}
            outgoing={outgoing}
            onAddRelationship={addRelationship}
            onDeleteRelationship={removeRelationship}
          />

          <BacklinksPanel
            incoming={incoming}
          />
        </aside>
      )}
    </div>
  );
}
