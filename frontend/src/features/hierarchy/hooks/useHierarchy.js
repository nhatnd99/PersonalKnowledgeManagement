import { useState, useEffect, useCallback } from 'react';
import * as noteService from '../../notes/services/noteService.js';

/**
 * Custom hook to manage nested hierarchy tree state, expansion, and moving.
 */
export function useHierarchy() {
  const [treeData, setTreeData] = useState([]);
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildTree = useCallback((notes) => {
    const nodeMap = new Map();
    const roots = [];

    // Initialize nodes
    notes.forEach((note) => {
      nodeMap.set(note.id, { ...note, children: [] });
    });

    // Wire parent-child
    notes.forEach((note) => {
      const node = nodeMap.get(note.id);
      if (note.parentId && nodeMap.has(note.parentId)) {
        nodeMap.get(note.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort siblings by sortOrder then title
    const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return (a.title || '').localeCompare(b.title || '');
      });
      nodes.forEach((n) => sortNodes(n.children));
    };

    sortNodes(roots);
    return roots;
  }, []);

  const loadTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await noteService.getNotes({ limit: 100 });
      const tree = buildTree(res.data || []);
      setTreeData(tree);
    } catch (err) {
      setError(err.message || 'Failed to load note hierarchy');
    } finally {
      setIsLoading(false);
    }
  }, [buildTree]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const toggleExpand = useCallback((nodeId) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const moveNoteToParent = useCallback(async (noteId, newParentId) => {
    try {
      await noteService.moveNote(noteId, newParentId);
      await loadTree();
      // Ensure target parent is expanded if not null
      if (newParentId) {
        setExpandedNodeIds((prev) => new Set([...prev, newParentId]));
      }
      return true;
    } catch (err) {
      setError(err.message || 'Failed to move note');
      throw err;
    }
  }, [loadTree]);

  return {
    treeData,
    expandedNodeIds,
    isLoading,
    error,
    toggleExpand,
    moveNoteToParent,
    reload: loadTree,
  };
}
