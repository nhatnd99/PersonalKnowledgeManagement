import { useNavigate } from 'react-router-dom';
import { Plus, Folder } from 'lucide-react';
import { HierarchyTree } from '../../features/hierarchy/components/HierarchyTree.jsx';
import * as noteService from '../../features/notes/services/noteService.js';
import { NOTE_TYPES } from '../../constants/index.js';

/**
 * Enhanced Sidebar integrating the full hierarchy tree outline and quick actions.
 */
export function Sidebar() {
  const navigate = useNavigate();

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
    <aside className="w-64 border-r border-border bg-card flex flex-col h-[calc(100vh-3.5rem)] select-none">
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
    </aside>
  );
}
