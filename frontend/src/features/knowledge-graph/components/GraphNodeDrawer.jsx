import PropTypes from 'prop-types';
import {
  X,
  FileText,
  Folder,
  FolderOpen,
  Star,
  ExternalLink,
  ArrowRight,
  Network,
  Tag,
  Link as LinkIcon,
} from 'lucide-react';

/**
 * Detailed drawer panel displayed when a node is selected in the Graph canvas.
 * Inspects properties, tags, local connections, and external cross-folder connections.
 */
export function GraphNodeDrawer({
  selectedNode,
  allEdges = [],
  allNodes = [],
  onClose,
  onOpenNote,
  onOpenFolderGraph,
  onConnectNode,
}) {
  if (!selectedNode) return null;

  const isFolder = selectedNode.type === 'FOLDER';
  const isScopeFolder = Boolean(selectedNode.isScopeFolder);

  // Find local connections from active edges in current graph
  const localEdges = allEdges.filter(
    (e) => (e.source === selectedNode.id || e.target === selectedNode.id) && !e.isHierarchy
  );

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  return (
    <aside
      aria-label="Node Details"
      className="absolute right-4 top-20 bottom-4 z-20 w-84 max-w-sm rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-border mb-4">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {isFolder ? (
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              {isScopeFolder ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isScopeFolder ? 'Current Scope Folder' : isFolder ? 'Folder' : 'Note'}
            </span>
            <h3 className="font-semibold text-foreground text-sm truncate leading-tight mt-0.5">
              {selectedNode.title || (isFolder ? 'Untitled Folder' : 'Untitled Note')}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close drawer"
          className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
        {/* Favorite & Info */}
        {selectedNode.isFavorite && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <span>Marked as Favorite</span>
          </div>
        )}

        {/* Folder Stats */}
        {isFolder && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
            <span className="text-muted-foreground">Contains:</span>
            <span className="font-medium text-foreground">
              {selectedNode.childCount || 0} {(selectedNode.childCount === 1 ? 'item' : 'items')}
            </span>
          </div>
        )}

        {/* Tags */}
        {selectedNode.tags && selectedNode.tags.length > 0 && (
          <div>
            <span className="text-muted-foreground block mb-1.5 font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>Tags</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground border border-border"
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

        {/* Local Scope Connections */}
        <div>
          <span className="text-muted-foreground block mb-1.5 font-medium flex items-center gap-1">
            <Network className="h-3 w-3" />
            <span>Connections in this Folder ({localEdges.length})</span>
          </span>

          {localEdges.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded-md">
              No direct relationships to items within this folder.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {localEdges.map((edge) => {
                const isSource = edge.source === selectedNode.id;
                const otherId = isSource ? edge.target : edge.source;
                const otherNode = nodeMap.get(otherId);
                const relType = edge.relationshipType?.replace('_', ' ') || 'CONNECTED';

                return (
                  <div
                    key={edge.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border hover:bg-muted/70 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-semibold text-primary block uppercase">
                        {isSource ? `→ ${relType}` : `← ${relType}`}
                      </span>
                      <span className="text-xs text-foreground truncate block font-medium">
                        {otherNode?.title || 'Unknown Note'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (otherNode?.type === 'FOLDER') {
                          onOpenFolderGraph(otherId);
                        } else {
                          onOpenNote(otherId);
                        }
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                      title="Navigate"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* External Connections count & guidance */}
        {(selectedNode.externalConnectionCount > 0) && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
              <LinkIcon className="h-3.5 w-3.5" />
              <span>External Connections</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This entity has <strong>{selectedNode.externalConnectionCount}</strong> conceptual {selectedNode.externalConnectionCount === 1 ? 'connection' : 'connections'} with notes or folders outside this scope. Open the note editor to view or edit full backlinks.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons in Drawer Footer */}
      <div className="pt-3 border-t border-border mt-3 space-y-2">
        {isFolder ? (
          !isScopeFolder && (
            <button
              type="button"
              onClick={() => onOpenFolderGraph(selectedNode.id)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors shadow-sm text-xs"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Open Folder Graph</span>
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => onOpenNote(selectedNode.id)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm text-xs"
          >
            <span>Open Note in Editor</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onConnectNode(selectedNode)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors text-xs"
        >
          <Network className="h-3.5 w-3.5 text-primary" />
          <span>Connect to Another Item</span>
        </button>
      </div>
    </aside>
  );
}

GraphNodeDrawer.propTypes = {
  selectedNode: PropTypes.object,
  allEdges: PropTypes.array,
  allNodes: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onOpenNote: PropTypes.func.isRequired,
  onOpenFolderGraph: PropTypes.func.isRequired,
  onConnectNode: PropTypes.func.isRequired,
};
