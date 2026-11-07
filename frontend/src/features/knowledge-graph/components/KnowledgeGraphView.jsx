import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { graphService } from '../services/graphService.js';
import { NoteNode } from './NoteNode.jsx';
import { GraphToolbar } from './GraphToolbar.jsx';
import { ArrowRight, FileText, Folder, Star, X, Sparkles } from 'lucide-react';

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
};

/**
 * Calculates initial 2D layout positions for graph nodes in a multi-ring circle.
 */
function layoutNodes(rawNodes) {
  const count = rawNodes.length;
  if (count === 0) return [];

  const centerX = 400;
  const centerY = 300;
  const radius = Math.max(180, count * 35);

  return rawNodes.map((node, index) => {
    const angle = (index / count) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return {
      id: node.id,
      type: 'noteNode',
      position: { x, y },
      data: node,
    };
  });
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

/**
 * KnowledgeGraphView: Interactive full-canvas graph visualization with React Flow.
 */
export function KnowledgeGraphView() {
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [relationshipType, setRelationshipType] = useState('');
  const [includeHierarchy, setIncludeHierarchy] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGraphData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await graphService.getGraph({
        relationshipType: relationshipType || undefined,
        includeHierarchy,
      });

      const formattedNodes = layoutNodes(data.nodes || []);
      const formattedEdges = layoutEdges(data.edges || []);

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load graph');
    } finally {
      setIsLoading(false);
    }
  }, [relationshipType, includeHierarchy, setNodes, setEdges]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node.data);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleOpenNote = (noteId) => {
    navigate(`/notes/${noteId}`);
  };

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div className="relative h-full w-full bg-background overflow-hidden">
      {/* Top Controls Toolbar */}
      <GraphToolbar
        relationshipType={relationshipType}
        onRelationshipTypeChange={setRelationshipType}
        includeHierarchy={includeHierarchy}
        onToggleHierarchy={() => setIncludeHierarchy(!includeHierarchy)}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      {error && (
        <div className="absolute top-20 left-4 z-10 p-3 rounded bg-destructive/10 text-destructive text-xs border border-destructive/20 shadow">
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
        <Background gap={16} size={1} color="currentColor" className="opacity-10 text-foreground" />
        <Controls className="!bg-card !border-border !shadow-md" />
        <MiniMap
          nodeColor={(n) => (n.data?.type === 'FOLDER' ? '#f59e0b' : '#3b82f6')}
          className="!bg-card/90 !border-border !rounded-lg !shadow-md"
        />
      </ReactFlow>

      {/* Empty State Overlay */}
      {!isLoading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-lg border border-border bg-card p-8 text-center max-w-sm shadow-xl pointer-events-auto">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">Graph is empty</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create notes and connect them with relationships to visualize your knowledge network.
            </p>
            <button
              type="button"
              onClick={() => navigate('/notes')}
              className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium"
            >
              Go to Notes
            </button>
          </div>
        </div>
      )}

      {/* Node Inspector Drawer on Selection */}
      {selectedNode && (
        <aside className="absolute right-4 top-4 z-20 w-80 rounded-lg border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              {selectedNode.type === 'FOLDER' ? (
                <Folder className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-primary shrink-0" />
              )}
              <h4 className="font-semibold text-foreground text-sm truncate">
                {selectedNode.title || 'Untitled Note'}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Type:</span>
              <span className="font-medium text-foreground">{selectedNode.type}</span>
            </div>

            {selectedNode.isFavorite && (
              <div className="flex items-center gap-1 text-amber-500 font-medium">
                <Star className="h-3.5 w-3.5 fill-amber-500" />
                <span>Starred Note</span>
              </div>
            )}

            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-1">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.tags.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: t.color || '#3b82f6' }}
                      />
                      <span>#{t.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleOpenNote(selectedNode.id)}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <span>Open Note in Editor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
