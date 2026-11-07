import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, Link2, FileText, Folder } from 'lucide-react';

const BACKLINK_LABELS = {
  RELATED_TO: 'Related from',
  DEPENDS_ON: 'Required by',
  REFERENCES: 'Referenced in',
  EXTENDS: 'Extended by',
  CONTRADICTS: 'Opposed by',
};

const BACKLINK_BADGES = {
  RELATED_TO: 'bg-muted text-muted-foreground border-border',
  DEPENDS_ON: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  REFERENCES: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  EXTENDS: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  CONTRADICTS: 'bg-destructive/10 text-destructive border-destructive/20',
};

/**
 * Panel rendering incoming backlinks (notes that point to the current note).
 */
export function BacklinksPanel({ incoming }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
          <span>Backlinks ({incoming.length})</span>
        </div>
      </div>

      {incoming.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
          <Link2 className="h-6 w-6 stroke-[1.5] text-muted-foreground/40 mx-auto mb-2" />
          <p className="font-medium text-foreground">No backlinks found</p>
          <p className="mt-0.5 text-muted-foreground">
            No other notes currently link or refer to this note.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {incoming.map((rel) => {
            const source = rel.sourceNote;
            const label = BACKLINK_LABELS[rel.relationshipType] || 'Linked from';
            const badgeClass = BACKLINK_BADGES[rel.relationshipType] || BACKLINK_BADGES.RELATED_TO;

            return (
              <div
                key={rel.id}
                className="flex items-start justify-between rounded-md border border-border bg-card/60 p-3 text-xs transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div className="space-y-1 pr-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}`}
                    >
                      {label}
                    </span>
                    <Link
                      to={`/notes/${source?.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      {source?.type === 'FOLDER' ? (
                        <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <span className="truncate">{source?.title || 'Untitled Note'}</span>
                    </Link>
                  </div>

                  {rel.description && (
                    <p className="text-muted-foreground italic text-[11px] line-clamp-2">
                      &quot;{rel.description}&quot;
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

BacklinksPanel.propTypes = {
  incoming: PropTypes.arrayOf(PropTypes.object).isRequired,
};
