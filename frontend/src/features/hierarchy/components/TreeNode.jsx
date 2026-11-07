import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Star,
  MoreVertical,
  Trash2,
  FolderPlus,
  FilePlus,
} from 'lucide-react';
import { NOTE_TYPES } from '../../../constants/index.js';

/**
 * Recursive tree node rendering with collapsible children, selection, and drag-and-drop.
 */
export function TreeNode({
  node,
  level = 0,
  expandedNodeIds,
  onToggleExpand,
  onMoveNote,
  onCreateChild,
  onDeleteNote,
}) {
  const isExpanded = expandedNodeIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isFolder = node.type === NOTE_TYPES.FOLDER;

  const [isDragOver, setIsDragOver] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Drag and drop handlers
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedNoteId = e.dataTransfer.getData('text/plain');

    if (draggedNoteId && draggedNoteId !== node.id) {
      try {
        await onMoveNote(draggedNoteId, node.id);
      } catch (err) {
        alert(err.message || 'Cannot move note here');
      }
    }
  };

  return (
    <div className="select-none">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors ${
          isDragOver ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted/70'
        }`}
        style={{ paddingLeft: `${Math.max(4, level * 14)}px` }}
      >
        {/* Expand / collapse chevron */}
        <button
          type="button"
          onClick={() => onToggleExpand(node.id)}
          className={`flex h-4 w-4 items-center justify-center rounded hover:bg-muted text-muted-foreground ${
            !hasChildren && !isFolder ? 'opacity-0 cursor-default' : ''
          }`}
          disabled={!hasChildren && !isFolder}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {/* Note link */}
        <NavLink
          to={`/notes/${node.id}`}
          className={({ isActive }) =>
            `flex flex-1 items-center gap-1.5 min-w-0 ${
              isActive ? 'text-primary font-semibold' : 'text-foreground/90'
            }`
          }
        >
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="truncate">{node.title || 'Untitled'}</span>
          {node.isFavorite && (
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0 ml-auto mr-1" />
          )}
        </NavLink>

        {/* Hover action menu trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Node actions"
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-opacity"
          >
            <MoreVertical className="h-3 w-3" />
          </button>

          {/* Context popover */}
          {showMenu && (
            <div
              className="absolute right-0 top-6 z-50 w-36 rounded-md border border-border bg-card p-1 shadow-lg text-xs"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onCreateChild(node.id, NOTE_TYPES.NOTE);
                }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 hover:bg-muted text-foreground"
              >
                <FilePlus className="h-3.5 w-3.5" />
                New Child Note
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onCreateChild(node.id, NOTE_TYPES.FOLDER);
                }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 hover:bg-muted text-foreground"
              >
                <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                New Folder
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onDeleteNote(node.id);
                }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render children recursively if expanded */}
      {isExpanded && hasChildren && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodeIds={expandedNodeIds}
              onToggleExpand={onToggleExpand}
              onMoveNote={onMoveNote}
              onCreateChild={onCreateChild}
              onDeleteNote={onDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
