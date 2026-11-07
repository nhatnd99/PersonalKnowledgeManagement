import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Trash2, Plus, Sparkles, FileText, Folder } from 'lucide-react';
import { AddRelationshipModal } from './AddRelationshipModal.jsx';

const TYPE_BADGES = {
  RELATED_TO: 'bg-muted text-muted-foreground border-border',
  DEPENDS_ON: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  REFERENCES: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  EXTENDS: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  CONTRADICTS: 'bg-destructive/10 text-destructive border-destructive/20',
};

/**
 * Panel rendering outgoing knowledge graph connections from the current note.
 */
export function RelationshipsPanel({ currentNoteId, outgoing, onAddRelationship, onDeleteRelationship }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingId(id);
    await onDeleteRelationship(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
          <span>Outgoing Connections ({outgoing.length})</span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-border bg-background hover:bg-muted text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span>Add Connection</span>
        </button>
      </div>

      {outgoing.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
          <Sparkles className="h-6 w-6 stroke-[1.5] text-muted-foreground/40 mx-auto mb-2" />
          <p className="font-medium text-foreground">No outgoing connections</p>
          <p className="mt-0.5 text-muted-foreground">
            Connect this note to related concepts or references.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            <Plus className="h-3 w-3" />
            Connect to a note
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {outgoing.map((rel) => {
            const target = rel.targetNote;
            const badgeClass = TYPE_BADGES[rel.relationshipType] || TYPE_BADGES.RELATED_TO;

            return (
              <div
                key={rel.id}
                className="group flex items-start justify-between rounded-md border border-border bg-card/60 p-3 text-xs transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div className="space-y-1 pr-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}`}
                    >
                      {rel.relationshipType.replace('_', ' ')}
                    </span>
                    <Link
                      to={`/notes/${target?.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      {target?.type === 'FOLDER' ? (
                        <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <span className="truncate">{target?.title || 'Untitled Note'}</span>
                    </Link>
                  </div>

                  {rel.description && (
                    <p className="text-muted-foreground italic text-[11px] line-clamp-2">
                      &quot;{rel.description}&quot;
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(rel.id, e)}
                  disabled={deletingId === rel.id}
                  title="Remove connection"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddRelationshipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentNoteId={currentNoteId}
        onAdd={onAddRelationship}
      />
    </div>
  );
}

RelationshipsPanel.propTypes = {
  currentNoteId: PropTypes.string.isRequired,
  outgoing: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddRelationship: PropTypes.func.isRequired,
  onDeleteRelationship: PropTypes.func.isRequired,
};
