import PropTypes from 'prop-types';
import { X, Folder, Plus, FolderTree } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HierarchyTree } from '../../features/hierarchy/components/HierarchyTree.jsx';
import * as noteService from '../../features/notes/services/noteService.js';
import { NOTE_TYPES } from '../../constants/index.js';

/**
 * MobileFolderDrawer: Slide-out drawer on mobile screens providing full access to
 * the nested folder and note hierarchy outline.
 */
export function MobileFolderDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCreateNote = async (type = NOTE_TYPES.NOTE) => {
    try {
      const title = type === NOTE_TYPES.FOLDER ? 'New Folder' : 'Untitled Note';
      const res = await noteService.createNote({
        title,
        type,
        content: null,
      });
      if (res.data?.id) {
        onClose();
        navigate(`/notes/${res.data.id}`);
      }
    } catch (err) {
      alert(`Could not create ${type.toLowerCase()}: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative z-50 w-4/5 max-w-xs h-full bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Hierarchy</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close hierarchy drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-b border-border flex gap-2">
          <button
            type="button"
            onClick={() => handleCreateNote(NOTE_TYPES.NOTE)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Note</span>
          </button>
          <button
            type="button"
            onClick={() => handleCreateNote(NOTE_TYPES.FOLDER)}
            className="flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted text-foreground transition-colors shadow-xs"
            title="New Folder"
          >
            <Folder className="h-3.5 w-3.5 text-amber-500" />
          </button>
        </div>

        {/* Tree Outline Container */}
        <div className="flex-1 p-2 overflow-y-auto">
          <HierarchyTree />
        </div>
      </div>
    </div>
  );
}

MobileFolderDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
