import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  X,
  Share2,
  Folder,
  FileText,
  FolderTree,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  RefreshCw,
  FolderRoot,
} from 'lucide-react';
import { getNoteById, moveNote, getNotes } from '../../notes/services/noteService.js';
import { relationshipService } from '../../relationships/services/relationshipService.js';
import { AddRelationshipModal } from '../../relationships/components/AddRelationshipModal.jsx';

const RELATIONSHIP_BADGES = {
  RELATED_TO: 'bg-muted text-muted-foreground border-border',
  DEPENDS_ON: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  REFERENCES: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  EXTENDS: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  CONTRADICTS: 'bg-destructive/10 text-destructive border-destructive/20',
};

/**
 * Unified Connections Drawer for managing Hierarchy (Parent)
 * and Semantic Knowledge Graph Relationships (Note <-> Note, Note <-> Folder).
 */
export function ConnectionsDrawer({
  isOpen,
  onClose,
  itemId,
  item: initialItem,
  onItemUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(initialItem || null);
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [candidateParents, setCandidateParents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState('UNSET');
  const [isSavingParent, setIsSavingParent] = useState(false);
  const [parentSuccessMsg, setParentSuccessMsg] = useState('');
  const [parentErrorMsg, setParentErrorMsg] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingRelId, setDeletingRelId] = useState(null);

  const loadItemData = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setParentErrorMsg('');
    setParentSuccessMsg('');
    try {
      const res = await getNoteById(itemId);
      const noteData = res.data;
      setItem(noteData);
      setSelectedParentId(noteData.parentId || 'ROOT');

      // Load relationships
      const relsRes = await relationshipService.getNoteRelationships(itemId);
      setOutgoing(relsRes.outgoing || []);
      setIncoming(relsRes.incoming || []);

      // Load candidate parents (all notes & folders)
      const allRes = await getNotes({ limit: 200 });
      setCandidateParents(allRes.data || []);
    } catch (err) {
      setParentErrorMsg(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (isOpen && itemId) {
      loadItemData();
    }
  }, [isOpen, itemId, loadItemData]);

  if (!isOpen) return null;

  const isFolder = item?.type === 'FOLDER';

  // Handle changing parent (moving item in hierarchy)
  const handleSaveParent = async (e) => {
    e.preventDefault();
    if (!item) return;

    const newParent = selectedParentId === 'ROOT' ? null : selectedParentId;
    if (newParent === (item.parentId || null)) {
      setParentSuccessMsg('Parent is unchanged.');
      setTimeout(() => setParentSuccessMsg(''), 2500);
      return;
    }

    setIsSavingParent(true);
    setParentErrorMsg('');
    setParentSuccessMsg('');

    try {
      await moveNote(item.id, newParent);
      setParentSuccessMsg('Hierarchy updated successfully!');
      setTimeout(() => setParentSuccessMsg(''), 3000);
      await loadItemData();
      if (onItemUpdated) {
        onItemUpdated({ ...item, parentId: newParent });
      }
    } catch (err) {
      setParentErrorMsg(
        err.response?.data?.message || err.message || 'Failed to move note'
      );
    } finally {
      setIsSavingParent(false);
    }
  };

  // Handle adding a semantic relationship
  const handleAddRelationship = async (payload) => {
    try {
      await relationshipService.createRelationship({
        sourceNoteId: item.id,
        targetNoteId: payload.targetNoteId,
        relationshipType: payload.relationshipType,
        description: payload.description,
      });

      // Reload relationships
      const relsRes = await relationshipService.getNoteRelationships(item.id);
      setOutgoing(relsRes.outgoing || []);
      setIncoming(relsRes.incoming || []);

      if (onItemUpdated) onItemUpdated();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Failed to create connection',
      };
    }
  };

  // Handle deleting a semantic relationship
  const handleDeleteRelationship = async (relId) => {
    setDeletingRelId(relId);
    try {
      await relationshipService.deleteRelationship(relId);
      setOutgoing((prev) => prev.filter((r) => r.id !== relId));
      if (onItemUpdated) onItemUpdated();
    } catch (err) {
      alert(err.message || 'Failed to delete connection');
    } finally {
      setDeletingRelId(null);
    }
  };

  // Filter valid candidate parents
  // 1. Cannot be self
  // 2. If current item is a FOLDER, parent cannot be a NOTE (only FOLDER or ROOT allowed)
  const validParents = candidateParents.filter((c) => {
    if (c.id === item?.id) return false;
    if (isFolder && c.type !== 'FOLDER') return false;
    return true;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] border-l border-border bg-card shadow-2xl flex flex-col transition-transform duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm text-foreground">Connections Drawer</h3>
              <p className="text-[11px] text-muted-foreground">Hierarchy & Semantic Relationships</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Close Drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading && !item ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span>Loading details...</span>
            </div>
          ) : (
            <>
              {/* SECTION 1: Current Item Info & Hierarchy Path */}
              <section className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Current Item
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      isFolder
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-primary/15 text-primary border border-primary/30'
                    }`}
                  >
                    {isFolder ? <Folder className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    {item?.type}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-base text-foreground truncate">
                    {item?.title || 'Untitled'}
                  </h4>

                  {/* Hierarchy Path */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 flex-wrap">
                    <span className="font-medium text-muted-foreground/80">Path:</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border border-border text-[11px]">
                      <FolderRoot className="h-3 w-3 text-muted-foreground" />
                      <span>Root</span>
                    </span>
                    {item?.parent && (
                      <>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border border-border text-[11px] truncate max-w-[150px]">
                          {item.parent.type === 'FOLDER' ? (
                            <Folder className="h-3 w-3 text-amber-500 shrink-0" />
                          ) : (
                            <FileText className="h-3 w-3 text-primary shrink-0" />
                          )}
                          <span className="truncate">{item.parent.title}</span>
                        </span>
                      </>
                    )}
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    <span className="font-medium text-foreground text-[11px] truncate max-w-[120px]">
                      {item?.title || 'Untitled'}
                    </span>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Hierarchy Management (Parent) */}
              <section className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <FolderTree className="h-3.5 w-3.5 text-primary" />
                  <span>Hierarchy Parent Management</span>
                </div>

                <div className="rounded-lg border border-border p-4 bg-card space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Organize where this {isFolder ? 'folder' : 'note'} lives in the tree. Moving it{' '}
                    <strong className="text-foreground">never alters</strong> semantic relationships.
                  </p>

                  {parentErrorMsg && (
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{parentErrorMsg}</span>
                    </div>
                  )}

                  {parentSuccessMsg && (
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs border border-emerald-500/20">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>{parentSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveParent} className="space-y-3">
                    <div>
                      <label
                        htmlFor="drawer-parent-select"
                        className="block text-xs font-medium text-foreground mb-1"
                      >
                        Select Parent Location:
                      </label>
                      <select
                        id="drawer-parent-select"
                        value={selectedParentId}
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="ROOT">📂 Root Workspace (Top-Level)</option>
                        {validParents.map((cand) => (
                          <option key={cand.id} value={cand.id}>
                            {cand.type === 'FOLDER' ? '📁' : '📄'} {cand.title || 'Untitled'} ({cand.type})
                          </option>
                        ))}
                      </select>
                      {isFolder && (
                        <p className="mt-1 text-[11px] text-muted-foreground italic">
                          Note: A folder can only be nested under another folder or at Root.
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isSavingParent}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isSavingParent && <RefreshCw className="h-3 w-3 animate-spin" />}
                        <span>Update Hierarchy Location</span>
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              {/* SECTION 3: Semantic Relationships */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Share2 className="h-3.5 w-3.5 text-primary" />
                    <span>Semantic Relationships ({outgoing.length + incoming.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Connect</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Outgoing Connections */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase">
                      <ArrowUpRight className="h-3 w-3 text-primary" />
                      <span>Outgoing ({outgoing.length})</span>
                    </div>

                    {outgoing.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-4">
                        No outgoing connections from this item.
                      </p>
                    ) : (
                      outgoing.map((rel) => {
                        const target = rel.targetNote;
                        const badgeStyle =
                          RELATIONSHIP_BADGES[rel.relationshipType] ||
                          RELATIONSHIP_BADGES.RELATED_TO;

                        return (
                          <div
                            key={rel.id}
                            className="group flex items-start justify-between rounded-md border border-border bg-card p-2.5 text-xs transition-colors hover:border-primary/40"
                          >
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeStyle}`}
                                >
                                  {rel.relationshipType.replace('_', ' ')}
                                </span>
                                <Link
                                  to={`/notes/${target?.id}`}
                                  onClick={onClose}
                                  className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1 truncate"
                                >
                                  {target?.type === 'FOLDER' ? (
                                    <Folder className="h-3 w-3 text-amber-500 shrink-0" />
                                  ) : (
                                    <FileText className="h-3 w-3 text-primary shrink-0" />
                                  )}
                                  <span className="truncate">{target?.title || 'Untitled'}</span>
                                </Link>
                              </div>
                              {rel.description && (
                                <p className="text-[11px] text-muted-foreground italic line-clamp-1">
                                  &quot;{rel.description}&quot;
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteRelationship(rel.id)}
                              disabled={deletingRelId === rel.id}
                              title="Delete relationship"
                              className="opacity-70 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Incoming Connections (Backlinks) */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase">
                      <ArrowDownLeft className="h-3 w-3 text-blue-500" />
                      <span>Incoming / Backlinks ({incoming.length})</span>
                    </div>

                    {incoming.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-4">
                        No incoming connections to this item.
                      </p>
                    ) : (
                      incoming.map((rel) => {
                        const source = rel.sourceNote;
                        const badgeStyle =
                          RELATIONSHIP_BADGES[rel.relationshipType] ||
                          RELATIONSHIP_BADGES.RELATED_TO;

                        return (
                          <div
                            key={rel.id}
                            className="flex items-start justify-between rounded-md border border-border bg-card p-2.5 text-xs transition-colors hover:border-primary/40"
                          >
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeStyle}`}
                                >
                                  {rel.relationshipType.replace('_', ' ')}
                                </span>
                                <Link
                                  to={`/notes/${source?.id}`}
                                  onClick={onClose}
                                  className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1 truncate"
                                >
                                  {source?.type === 'FOLDER' ? (
                                    <Folder className="h-3 w-3 text-amber-500 shrink-0" />
                                  ) : (
                                    <FileText className="h-3 w-3 text-primary shrink-0" />
                                  )}
                                  <span className="truncate">{source?.title || 'Untitled'}</span>
                                </Link>
                              </div>
                              {rel.description && (
                                <p className="text-[11px] text-muted-foreground italic line-clamp-1">
                                  &quot;{rel.description}&quot;
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Modal for adding connection */}
        {item && (
          <AddRelationshipModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            currentNoteId={item.id}
            onAdd={handleAddRelationship}
          />
        )}
      </aside>
    </>
  );
}

ConnectionsDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemId: PropTypes.string,
  item: PropTypes.object,
  onItemUpdated: PropTypes.func,
};
