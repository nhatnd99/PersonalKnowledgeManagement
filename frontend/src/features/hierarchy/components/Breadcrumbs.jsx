import { Link } from 'react-router-dom';
import { ChevronRight, Home, Folder, FileText } from 'lucide-react';
import { NOTE_TYPES } from '../../../constants/index.js';

/**
 * Breadcrumbs navigation showing full path from root to current note.
 * @param {Object} props
 * @param {Object} props.note - Current note with its parent relation
 */
export function Breadcrumbs({ note }) {
  if (!note) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link
        to="/notes"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3 w-3" />
        <span>Root</span>
      </Link>

      {note.parent && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          <Link
            to={`/notes/${note.parent.id}`}
            className="flex items-center gap-1 hover:text-foreground transition-colors truncate max-w-[150px]"
          >
            {note.parent.type === NOTE_TYPES.FOLDER ? (
              <Folder className="h-3 w-3 text-amber-500" />
            ) : (
              <FileText className="h-3 w-3" />
            )}
            <span className="truncate">{note.parent.title}</span>
          </Link>
        </>
      )}

      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
      <span className="font-medium text-foreground truncate max-w-[200px]">
        {note.title || 'Untitled'}
      </span>
    </nav>
  );
}
