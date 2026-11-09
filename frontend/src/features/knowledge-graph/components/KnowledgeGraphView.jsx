import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { Sparkles, FolderPlus, FilePlus } from 'lucide-react';
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
 * Calculates initial 2D layout positions for scoped graph nodes.
 * If there is a current scope folder node, it is placed at the center,
 * while direct children are arranged in an orbit around it.
 */
function layoutScopedNodes(rawNodes, handlers) {
  const count = rawNodes.length;
  if (count === 0) return [];

  const centerX = 400;
  const centerY = 300;

  const scopeFolderNode = rawNodes.find((n) => n.isScopeFolder);
  const otherNodes = rawNodes.filter((n) => !n.isScopeFolder);

  const formattedNodes = [];

  // Place container folder node at center
  if (scopeFolderNode) {
    formattedNodes.push({
      id: scopeFolderNode.id,
      type: 'folderNode',
      position: { x: centerX, y: centerY },
      data: {
        ...scopeFolderNode,
        ...handlers,
      },
    });
  }

  // Position remaining nodes in an orbit circle
  const orbitCount = otherNodes.length;
  const radius = Math.max(220, orbitCount * 45);

  otherNodes.forEach((node, index) => {
    const angle = (index / Math.max(1, orbitCount)) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    formattedNodes.push({
      id: node.id,
      type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
      position: { x, y },
      data: {
        ...node,
        ...handlers,
      },
    });
  });

  return formattedNodes;
}

/**
 * Converts raw relationships into React Flow edges with directional arrows and color coding.
 */
function layoutEdges(rawEdges) {
  return rawEdges.map((edge) => {
    const color = EDGE_COLORS[edge.relationshipType] || '#64748b';
    const isHierarchy = edge.isHierarchy;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.relationshipType.replace('_', ' '),
      labelStyle: { fill: color, fontWeight: 600, fontSize: 10 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
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
  const location = useLocation();
  const { folderId } = useParams();
  const reactFlowInstance = useReactFlow();

  // Determine effective folder scope: 'root' if at /graph, /graph/root or no folderId
  const effectiveFolderId = folderId || (location.pathname.includes('/folders/') ? null : 'root');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [scopeData, setScopeData] = useState(null);
  const [rawNodesList, setRawNodesList] = useState([]);
  const [relationshipType, setRelationshipType] = useState('');
  const [includeHierarchy, setIncludeHierarchy] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Connection modal state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectSourceNode, setConnectSourceNode] = useState(null);

  const handleOpenFolderGraph = useCallback(
    (targetFolderId) => {
      setSelectedNode(null);
      if (targetFolderId === 'root') {
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

  const nodeHandlers = useMemo(
    () => ({
      onOpenFolderGraph: handleOpenFolderGraph,
      onOpenNote: handleOpenNote,
      onConnectNode: handleOpenConnectModal,
    }),
    [handleOpenFolderGraph, handleOpenNote, handleOpenConnectModal]
  );

  const fetchGraphData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await graphService.getFolderGraph(effectiveFolderId, {
        relationshipType: relationshipType || undefined,
        includeHierarchy,
      });

      setScopeData(data.scope);
      setRawNodesList(data.nodes || []);

      const formattedNodes = layoutScopedNodes(data.nodes || [], nodeHandlers);
      const formattedEdges = layoutEdges(data.edges || []);

      setNodes(formattedNodes);
      setEdges(formattedEdges);

      // Keep selectedNode synchronized if already open
      setSelectedNode((prev) => {
        if (!prev) return null;
        return data.nodes?.find((n) => n.id === prev.id) || null;
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load graph');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveFolderId, relationshipType, includeHierarchy, nodeHandlers, setNodes, setEdges]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node.data);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }
  }, [reactFlowInstance]);

  const handleCreateChild = async (type = NOTE_TYPES.NOTE) => {
    try {
      const parentId = effectiveFolderId === 'root' ? null : effectiveFolderId;
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
          fetchGraphData();
        }
      }
    } catch (err) {
      alert(`Could not create item: ${err.message}`);
    }
  };

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div className="relative h-full w-full bg-background overflow-hidden">
      {/* Top Controls & Breadcrumbs Toolbar */}
      <GraphToolbar
        scope={scopeData}
        breadcrumbs={scopeData?.breadcrumbs || [{ id: 'root', title: 'Root' }]}
        onNavigateBreadcrumb={handleOpenFolderGraph}
        relationshipType={relationshipType}
        onRelationshipTypeChange={setRelationshipType}
        includeHierarchy={includeHierarchy}
        onToggleHierarchy={() => setIncludeHierarchy(!includeHierarchy)}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        onRefresh={fetchGraphData}
        onFitView={handleFitView}
        onOpenConnectModal={() => handleOpenConnectModal(null)}
      />

      {error && (
        <div className="absolute top-20 left-4 z-20 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 shadow-lg backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={memoizedNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        className="bg-muted/10"
      >
        <Background gap={18} size={1} color="currentColor" className="opacity-10 text-foreground" />
        <Controls className="!bg-card !border-border !shadow-lg !rounded-xl overflow-hidden" />
        <MiniMap
          nodeColor={(n) => (n.data?.type === 'FOLDER' ? '#f59e0b' : '#3b82f6')}
          className="!bg-card/90 !border-border !rounded-xl !shadow-lg backdrop-blur-md"
        />
      </ReactFlow>

      {/* Empty State Overlay */}
      {!isLoading && nodes.length <= 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl border border-border bg-card/95 p-8 text-center max-w-sm shadow-2xl pointer-events-auto backdrop-blur-md">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">
              {nodes.length === 1 ? 'Folder is empty' : 'Workspace is empty'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-5 leading-relaxed">
              {nodes.length === 1
                ? 'This folder does not contain any child notes or subfolders yet.'
                : 'Create top-level notes and folders to begin building your knowledge graph.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleCreateChild(NOTE_TYPES.NOTE)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                <FilePlus className="h-3.5 w-3.5" />
                <span>Create Note</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreateChild(NOTE_TYPES.FOLDER)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors shadow-sm"
              >
                <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                <span>Create Subfolder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Node Inspector Drawer on Selection */}
      <GraphNodeDrawer
        selectedNode={selectedNode}
        allEdges={edges}
        allNodes={rawNodesList}
        onClose={() => setSelectedNode(null)}
        onOpenNote={handleOpenNote}
        onOpenFolderGraph={handleOpenFolderGraph}
        onConnectNode={(node) => handleOpenConnectModal(node)}
      />

      {/* Connect Modal */}
      <GraphConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        sourceNode={connectSourceNode}
        availableNodes={rawNodesList}
        onSuccess={fetchGraphData}
      />
    </div>
  );
}

/**
 * KnowledgeGraphView with ReactFlowProvider wrapper.
 */
export function KnowledgeGraphView() {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphCanvas />
    </ReactFlowProvider>
  );
}
