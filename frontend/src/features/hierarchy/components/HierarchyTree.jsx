import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHierarchy } from '../hooks/useHierarchy.js';
import { TreeNode } from './TreeNode.jsx';
import { RefreshCw } from 'lucide-react';
import * as noteService from '../../notes/services/noteService.js';
import { NOTE_TYPES } from '../../../constants/index.js';
import { DeleteConfirmModal } from '../../notes/components/DeleteConfirmModal.jsx';
import { MoveToModal } from './MoveToModal.jsx';

/**
 * HierarchyTree: Main component rendering full nested outline of notes and folders.
 */
export function HierarchyTree() {
  const {
    treeData,
    expandedNodeIds,
    isLoading,
    error,
    toggleExpand,
    moveNoteToParent,
    reload,
  } = useHierarchy();

  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);

  const handleCreateChild = async (parentId, type = NOTE_TYPES.NOTE) => {
    try {
      const title = type === NOTE_TYPES.FOLDER ? 'New Folder' : 'Untitled Note';
      const res = await noteService.createNote({
        title,
        type,
        parentId,
      });
      await reload();
      if (res.data?.id) {
        navigate(`/notes/${res.data.id}`);
      }
    } catch (err) {
      alert(`Could not create child: ${err.message}`);
    }
  };

  const handleDeleteNote = (target) => {
    if (typeof target === 'string') {
      setDeleteTarget({ id: target, title: 'Item', type: NOTE_TYPES.NOTE });
    } else {
      setDeleteTarget(target);
    }
  };

  const handleDeleted = async () => {
    await reload();
    navigate('/notes');
  };

  const handleRootDrop = async (e) => {
    e.preventDefault();
    const draggedNoteId = e.dataTransfer.getData('text/plain');
    if (draggedNoteId) {
      try {
        await moveNoteToParent(draggedNoteId, null);
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Cannot move note to root');
      }
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleRootDrop}
      className="flex flex-col flex-1 min-h-0"
    >
      <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
        <span>Hierarchy</span>
        <button
          type="button"
          onClick={reload}
          className="hover:text-foreground"
          title="Reload tree"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {isLoading ? (
          <div className="p-4 text-xs text-muted-foreground text-center">Loading tree...</div>
        ) : error ? (
          <div className="p-2 text-xs text-destructive text-center">{error}</div>
        ) : treeData.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground text-center">
            No notes found. Create your first note above.
          </div>
        ) : (
          treeData.map((rootNode) => (
            <TreeNode
              key={rootNode.id}
              node={rootNode}
              level={0}
              expandedNodeIds={expandedNodeIds}
              onToggleExpand={toggleExpand}
              onMoveNote={moveNoteToParent}
              onCreateChild={handleCreateChild}
              onDeleteNote={handleDeleteNote}
              onOpenMoveModal={setMoveTarget}
            />
          ))
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        noteId={deleteTarget?.id}
        initialTarget={deleteTarget}
        onDeleted={handleDeleted}
      />

      <MoveToModal
        isOpen={Boolean(moveTarget)}
        onClose={() => setMoveTarget(null)}
        targetNode={moveTarget}
        onMove={async (id, parentId) => {
          await moveNoteToParent(id, parentId);
          await reload();
        }}
      />
    </div>
  );
}
