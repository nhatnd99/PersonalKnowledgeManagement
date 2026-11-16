import { useNavigate, Link } from 'react-router-dom';
import { Plus, Folder, Settings } from 'lucide-react';
import { HierarchyTree } from '../../features/hierarchy/components/HierarchyTree.jsx';
import * as noteService from '../../features/notes/services/noteService.js';
import { NOTE_TYPES } from '../../constants/index.js';
import { useAuth } from '../../features/auth/hooks/useAuth.js';

/**
 * Enhanced Sidebar integrating the full hierarchy tree outline, quick actions, and user profile footer.
 */
export function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateNote = async (type = NOTE_TYPES.NOTE) => {
    try {
      const title = type === NOTE_TYPES.FOLDER ? 'New Folder' : 'Untitled Note';
      const res = await noteService.createNote({
        title,
        type,
        content: null,
      });
      if (res.data?.id) {
        navigate(`/notes/${res.data.id}`);
      }
    } catch (err) {
      alert(`Could not create ${type.toLowerCase()}: ${err.message}`);
    }
  };

  return (
    <aside className="hidden md:flex w-60 lg:w-64 border-r border-border bg-card flex-col h-[calc(100vh-3.5rem)] select-none shrink-0">
      {/* Action buttons */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => handleCreateNote(NOTE_TYPES.NOTE)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Note
          </button>
          <button
            type="button"
            onClick={() => handleCreateNote(NOTE_TYPES.FOLDER)}
            className="flex items-center justify-center rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted text-foreground transition-colors"
            title="New Folder"
          >
            <Folder className="h-3.5 w-3.5 text-amber-500" />
          </button>
        </div>
      </div>

      {/* Full Hierarchy Tree View */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col">
        <HierarchyTree />
      </div>

      {/* User Footer Profile */}
      {user && (
        <div className="p-2.5 border-t border-border bg-card/60 flex items-center justify-between">
          <Link
            to="/settings"
            className="flex items-center gap-2 overflow-hidden hover:opacity-80 transition"
            title="Account Settings"
          >
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-semibold text-foreground truncate">
                {user.displayName || 'Knowledge User'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </Link>
          <Link
            to="/settings"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </aside>
  );
}
