import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  ExternalLink,
  FolderOpen,
  Edit2,
  FilePlus,
  FolderPlus,
  FolderInput,
  Network,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';
import { NOTE_TYPES } from '../../../constants/index.js';

/**
 * Context menu for Graph nodes.
 * Supports desktop right-click and mobile touch actions with complete CRUD and connection shortcuts.
 */
export function GraphContextMenu({
  isOpen,
  position,
  targetNode,
  onClose,
  onOpenNote,
  onOpenFolderGraph,
  onRename,
  onCreateChildNote,
  onCreateSubfolder,
  onMoveTo,
  onConnect,
  onViewConnections,
  onDelete,
}) {
  const menuRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !targetNode) return null;

  const isFolder = targetNode.type === NOTE_TYPES.FOLDER;
  const isCentralNode = Boolean(targetNode.isCentralNode || targetNode.isScopeFolder);

  // Keep menu within viewport boundaries
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuWidth = 200;
  const menuHeight = 280;

  const x = Math.min(position?.x ?? 100, viewportWidth - menuWidth - 16);
  const y = Math.min(position?.y ?? 100, viewportHeight - menuHeight - 16);

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(12, x)}px`, top: `${Math.max(12, y)}px` }}
      className="fixed z-50 w-52 rounded-xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-md text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Title Header */}
      <div className="px-2.5 py-1.5 border-b border-border/60 mb-1">
        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
          {isCentralNode ? 'Central Scope' : isFolder ? 'Folder' : 'Note'}
        </span>
        <span className="font-semibold text-foreground truncate block leading-tight">
          {targetNode.title || (isFolder ? 'Untitled Folder' : 'Untitled Note')}
        </span>
      </div>

      {/* Primary Open Action */}
      {isFolder ? (
        !isCentralNode && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFolderGraph(targetNode.id);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-foreground hover:bg-muted transition-colors font-medium"
          >
            <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
            <span>Open Folder Graph</span>
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenNote(targetNode.id);
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-foreground hover:bg-muted transition-colors font-medium"
        >
          <ExternalLink className="h-3.5 w-3.5 text-primary" />
          <span>Open in Editor</span>
        </button>
      )}

      {/* Rename */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onRename(targetNode);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-foreground hover:bg-muted transition-colors"
      >
        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Rename</span>
      </button>

      {/* Create Child inside Folder */}
      {isFolder && (
        <>
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateChildNote(targetNode.id);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-foreground hover:bg-muted transition-colors"
          >
            <FilePlus className="h-3.5 w-3.5 text-blue-500" />
            <span>Create Child Note</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateSubfolder(targetNode.id);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-foreground hover:bg-muted transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
            <span>Create Subfolder</span>
          </button>
        </>
      )}

      {/* Move To */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onMoveTo(targetNode);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-foreground hover:bg-muted transition-colors"
      >
        <FolderInput className="h-3.5 w-3.5 text-indigo-500" />
        <span>Move to...</span>
      </button>

      <div className="h-px bg-border/60 my-1" />

      {/* Connect to Another Item */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onConnect(targetNode);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-foreground hover:bg-muted transition-colors"
      >
        <LinkIcon className="h-3.5 w-3.5 text-primary" />
        <span>Connect Item</span>
      </button>

      {/* View Connections Drawer */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onViewConnections(targetNode);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-foreground hover:bg-muted transition-colors"
      >
        <Network className="h-3.5 w-3.5 text-emerald-500" />
        <span>View Connections</span>
      </button>

      <div className="h-px bg-border/60 my-1" />

      {/* Delete */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onDelete(targetNode);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-destructive hover:bg-destructive/10 transition-colors font-medium"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete...</span>
      </button>
    </div>
  );
}

GraphContextMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  targetNode: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onOpenNote: PropTypes.func.isRequired,
  onOpenFolderGraph: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onCreateChildNote: PropTypes.func.isRequired,
  onCreateSubfolder: PropTypes.func.isRequired,
  onMoveTo: PropTypes.func.isRequired,
  onConnect: PropTypes.func.isRequired,
  onViewConnections: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
