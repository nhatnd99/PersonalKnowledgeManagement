import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { graphService } from '../services/graphService.js';
import * as noteService from '../../notes/services/noteService.js';
import { NoteNode } from './NoteNode.jsx';
import { FolderNode } from './FolderNode.jsx';
import { GraphToolbar } from './GraphToolbar.jsx';
import { GraphNodeDrawer } from './GraphNodeDrawer.jsx';
import { GraphConnectModal } from './GraphConnectModal.jsx';
import { GraphContextMenu } from './GraphContextMenu.jsx';
import { GraphErrorState } from './GraphErrorState.jsx';
import { GraphEmptyState } from './GraphEmptyState.jsx';
import { RenameModal } from '../../notes/components/RenameModal.jsx';
import { MoveToModal } from '../../hierarchy/components/MoveToModal.jsx';
import { DeleteConfirmModal } from '../../notes/components/DeleteConfirmModal.jsx';
import { ConnectionsDrawer } from '../../connections/components/ConnectionsDrawer.jsx';
import { useGraphData } from '../hooks/useGraphData.js';
import { layoutGraphNodes } from '../utils/graphLayout.js';
import { NOTE_TYPES } from '../../../constants/index.js';

const EDGE_COLORS = {
  RELATED_TO: '#64748b',
  DEPENDS_ON: '#f59e0b',
  REFERENCES: '#3b82f6',
  EXTENDS: '#10b981',
  CONTRADICTS: '#ef4444',
  PARENT_OF: '#8b5cf6',
};

const nodeTypes = {
  noteNode: NoteNode,
  folderNode: FolderNode,
};

/**
 * Converts raw relationships and hierarchy connections into styled React Flow edges.
 */
function formatGraphEdges(rawEdges) {
  return (rawEdges || []).map((edge) => {
    const isHierarchy = Boolean(edge.isHierarchy);
    const color = EDGE_COLORS[edge.relationshipType] || (isHierarchy ? '#8b5cf6' : '#64748b');
    const label = edge.description || edge.label || edge.relationshipType.replace(/_/g, ' ');

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label,
      labelStyle: { fill: color, fontWeight: 600, fontSize: 10 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      animated: edge.relationshipType === 'DEPENDS_ON',
      style: {
        stroke: color,
        strokeWidth: isHierarchy ? 1.5 : 2,
        strokeDasharray: isHierarchy ? '4 4' : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 14,
        height: 14,
      },
    };
  });
}

function KnowledgeGraphCanvas() {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const reactFlowInstance = useReactFlow();
  const containerRef = useRef(null);

  // Root Workspace is active for /graph, /graph/root or when no folderId is provided
  const effectiveFolderId = folderId || 'root';
  const isRootScope = effectiveFolderId === 'root';

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Independent edge & node visibility toggles
  const [relationshipType, setRelationshipType] = useState('');
  const [includeHierarchy, setIncludeHierarchy] = useState(true);
  const [includeKnowledge, setIncludeKnowledge] = useState(true);
  const [includeExternal, setIncludeExternal] = useState(true);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected node (for side inspector drawer)
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerNode, setDrawerNode] = useState(null);
  const [foldersList, setFoldersList] = useState([]);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    targetNode: null,
  });

  // Modal dialog states
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectSourceNode, setConnectSourceNode] = useState(null);

  const [renameTarget, setRenameTarget] = useState(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const [moveTarget, setMoveTarget] = useState(null);
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Drag positions map to persist user manual positioning during session
  const dragPositionsRef = useRef(new Map());

  // Clear preserved drag positions when changing folder scope
  useEffect(() => {
    dragPositionsRef.current.clear();
  }, [effectiveFolderId]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Dedicated data fetching hook with race-condition protection
  const {
    scopeData,
    rawNodes,
    rawEdges,
    metadata,
    isLoading,
    error,
    reload,
  } = useGraphData(effectiveFolderId, {
    relationshipType,
    includeHierarchy,
    includeKnowledge,
    includeExternal,
  });

  // Fetch available folders for dropdown switcher
  const loadFolders = useCallback(async () => {
    try {
      const res = await graphService.getFoldersList();
      setFoldersList(res.folders || []);
    } catch {
      // Non-blocking error
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleOpenFolderGraph = useCallback(
    (targetFolderId) => {
      setSelectedNode(null);
      setDrawerNode(null);
      setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, targetNode: null });
      if (targetFolderId === 'root' || !targetFolderId) {
        navigate('/graph/root');
      } else {
        navigate(`/graph/folders/${targetFolderId}`);
      }
    },
    [navigate]
  );

  const handleOpenNote = useCallback(
    (noteId) => {
      navigate(`/notes/${noteId}`);
    },
    [navigate]
  );

  const handleOpenConnectModal = useCallback((sourceNode = null) => {
    setConnectSourceNode(sourceNode || null);
    setIsConnectModalOpen(true);
  }, []);

  const handleOpenDrawer = useCallback((node) => {
    setDrawerNode(node);
  }, []);

  // Context Menu Trigger
  const handleNodeContextMenu = useCallback((event, nodeData) => {
    if (event?.preventDefault) event.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      targetNode: nodeData,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, targetNode: null });
  }, []);

  // Handlers attached to each node data
  const nodeHandlers = useMemo(
    () => ({
      onOpenFolderGraph: handleOpenFolderGraph,
      onOpenNote: handleOpenNote,
      onConnectNode: handleOpenDrawer,
      onNodeContextMenu: handleNodeContextMenu,
    }),
    [handleOpenFolderGraph, handleOpenNote, handleOpenDrawer, handleNodeContextMenu]
  );

  // Update React Flow nodes and edges when data changes
  useEffect(() => {
    if (rawNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const formattedNodes = layoutGraphNodes(
      rawNodes,
      nodeHandlers,
      isRootScope,
      dragPositionsRef.current
    );
    const formattedEdges = formatGraphEdges(rawEdges);

    setNodes(formattedNodes);
    setEdges(formattedEdges);

    // Keep selectedNode synchronized if already open
    setSelectedNode((prev) => {
      if (!prev) return null;
      return rawNodes.find((n) => n.id === prev.id) || null;
    });
  }, [rawNodes, rawEdges, nodeHandlers, isRootScope, setNodes, setEdges]);

  // Fit view whenever folder scope changes
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.25, duration: 400 });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [effectiveFolderId, reactFlowInstance, nodes.length]);

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node.data);
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, targetNode: null });
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, targetNode: null });
  }, []);

  const onNodeDragStop = useCallback((_event, node) => {
    dragPositionsRef.current.set(node.id, {
      x: node.position.x,
      y: node.position.y,
    });
  }, []);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.25, duration: 400 });
    }
  }, [reactFlowInstance]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([reload(), loadFolders()]);
  }, [reload, loadFolders]);

  const handleCreateChild = async (type = NOTE_TYPES.NOTE, targetParentId = null) => {
    try {
      const parentId = targetParentId !== null ? targetParentId : (isRootScope ? null : effectiveFolderId);
      const title = type === NOTE_TYPES.FOLDER ? 'New Folder' : 'Untitled Note';
      const res = await noteService.createNote({
        title,
        type,
        parentId,
      });
      if (res.data?.id) {
        if (type === NOTE_TYPES.NOTE) {
          navigate(`/notes/${res.data.id}`);
        } else {
          await handleRefresh();
        }
      }
    } catch (err) {
      alert(`Could not create item: ${err.message}`);
    }
  };

  // Node CRUD Action Triggers
  const handleTriggerRename = useCallback((node) => {
    setRenameTarget(node);
    setIsRenameOpen(true);
  }, []);

  const handleTriggerMove = useCallback((node) => {
    setMoveTarget(node);
    setIsMoveOpen(true);
  }, []);

  const handleConfirmMove = useCallback(async (noteId, newParentId) => {
    await noteService.moveNote(noteId, newParentId);
    await handleRefresh();
  }, [handleRefresh]);

  const handleTriggerDelete = useCallback((node) => {
    setDeleteTarget(node);
    setIsDeleteOpen(true);
  }, []);

  const handleDeleted = useCallback(async (deletedItem) => {
    if (deletedItem?.id === effectiveFolderId) {
      navigate('/graph/root');
    } else {
      setSelectedNode(null);
      await handleRefresh();
    }
  }, [effectiveFolderId, navigate, handleRefresh]);

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Display user-friendly error state with recovery button if folder not found
  if (error && !isLoading) {
    return (
      <GraphErrorState
        error={error}
        folderId={effectiveFolderId}
        onNavigateRoot={() => navigate('/graph/root')}
        onRetry={reload}
      />
    );
  }

  const isEmpty = !isLoading && (isRootScope ? nodes.length === 0 : nodes.length <= 1);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-background overflow-hidden"
    >
      {/* Top Floating Controls & Breadcrumbs Toolbar */}
      <GraphToolbar
        scope={scopeData}
        breadcrumbs={scopeData?.breadcrumbs || [{ id: 'root', title: 'Root Workspace' }]}
        onNavigateBreadcrumb={handleOpenFolderGraph}
        relationshipType={relationshipType}
        onRelationshipTypeChange={setRelationshipType}
        includeHierarchy={includeHierarchy}
        onToggleHierarchy={() => setIncludeHierarchy(!includeHierarchy)}
        includeKnowledge={includeKnowledge}
        onToggleKnowledge={() => setIncludeKnowledge(!includeKnowledge)}
        includeExternal={includeExternal}
        onToggleExternal={() => setIncludeExternal(!includeExternal)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        nodeCount={metadata?.nodeCount ?? nodes.length}
        edgeCount={metadata?.edgeCount ?? edges.length}
        onRefresh={handleRefresh}
        onFitView={handleFitView}
        onOpenConnectModal={() => handleOpenConnectModal(null)}
        foldersList={foldersList}
      />

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={memoizedNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={(e, node) => handleNodeContextMenu(e, node.data)}
        onNodeDragStop={onNodeDragStop}
        fitView
        className="bg-muted/10"
      >
        <Background gap={18} size={1} color="currentColor" className="opacity-10 text-foreground" />
        <Controls className="!bg-card !border-border !shadow-lg !rounded-xl overflow-hidden mb-2 sm:mb-0" />
        <MiniMap
          nodeColor={(n) => (n.data?.type === 'FOLDER' ? '#f59e0b' : '#3b82f6')}
          className="!hidden sm:!block !bg-card/90 !border-border !rounded-xl !shadow-lg backdrop-blur-md"
        />
      </ReactFlow>

      {/* Empty State Overlay */}
      {isEmpty && (
        <GraphEmptyState
          isFolder={!isRootScope}
          folderTitle={scopeData?.title}
          onCreateChild={handleCreateChild}
        />
      )}

      {/* Node Inspector Drawer on Selection */}
      <GraphNodeDrawer
        selectedNode={selectedNode}
        allEdges={edges}
        allNodes={rawNodes}
        onClose={() => setSelectedNode(null)}
        onOpenNote={handleOpenNote}
        onOpenFolderGraph={handleOpenFolderGraph}
        onConnectNode={(node) => setDrawerNode(node)}
        onRename={handleTriggerRename}
        onMoveTo={handleTriggerMove}
        onDelete={handleTriggerDelete}
      />

      {/* Floating Context Menu */}
      <GraphContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        targetNode={contextMenu.targetNode}
        onClose={handleCloseContextMenu}
        onOpenNote={handleOpenNote}
        onOpenFolderGraph={handleOpenFolderGraph}
        onRename={handleTriggerRename}
        onCreateChildNote={(parentId) => handleCreateChild(NOTE_TYPES.NOTE, parentId)}
        onCreateSubfolder={(parentId) => handleCreateChild(NOTE_TYPES.FOLDER, parentId)}
        onMoveTo={handleTriggerMove}
        onConnect={(node) => handleOpenConnectModal(node)}
        onViewConnections={(node) => handleOpenDrawer(node)}
        onDelete={handleTriggerDelete}
      />

      {/* Connect Modal */}
      <GraphConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        sourceNode={connectSourceNode}
        availableNodes={rawNodes}
        onSuccess={handleRefresh}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        target={renameTarget}
        onRenamed={handleRefresh}
      />

      {/* Move To Modal */}
      <MoveToModal
        isOpen={isMoveOpen}
        onClose={() => setIsMoveOpen(false)}
        targetNode={moveTarget}
        onMove={handleConfirmMove}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        noteId={deleteTarget?.id}
        initialTarget={deleteTarget}
        onDeleted={handleDeleted}
      />

      {/* Full Connections Drawer (Hierarchy + Semantic) */}
      {drawerNode && (
        <ConnectionsDrawer
          isOpen={Boolean(drawerNode)}
          onClose={() => setDrawerNode(null)}
          itemId={drawerNode.id}
          item={drawerNode}
          onItemUpdated={handleRefresh}
        />
      )}
    </div>
  );
}

/**
 * KnowledgeGraphView wrapped with ReactFlowProvider.
 */
export function KnowledgeGraphView() {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphCanvas />
    </ReactFlowProvider>
  );
}
