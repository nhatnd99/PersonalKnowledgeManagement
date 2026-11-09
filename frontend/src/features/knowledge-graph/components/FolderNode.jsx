import { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { Folder, FolderOpen, ArrowRight, Network } from 'lucide-react';

/**
 * Custom React Flow node representing an organizational folder.
 * Features amber styling, child counts, external connection badges, and drill-down navigation.
 */
export const FolderNode = memo(function FolderNode({ data, selected }) {
  const isScopeFolder = Boolean(data.isScopeFolder);
  const childCount = data.childCount || 0;
  const externalCount = data.externalConnectionCount || 0;

  const handleOpenGraph = (e) => {
    e.stopPropagation();
    if (data.onOpenFolderGraph) {
      data.onOpenFolderGraph(data.id);
    }
  };

  const handleConnect = (e) => {
    e.stopPropagation();
    if (data.onConnectNode) {
      data.onConnectNode(data);
    }
  };

  return (
    <div
      onDoubleClick={handleOpenGraph}
      className={`relative min-w-[180px] max-w-[240px] rounded-xl border bg-card p-3 shadow-md transition-all cursor-pointer ${
        isScopeFolder
          ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/5 shadow-amber-500/10'
          : selected
          ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
          : 'border-amber-500/40 hover:border-amber-500 hover:shadow-lg'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-amber-500"
      />

      {/* Top Header: Badge & Status */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {isScopeFolder ? (
            <>
              <FolderOpen className="h-3 w-3" />
              <span>Current Folder</span>
            </>
          ) : (
            <>
              <Folder className="h-3 w-3" />
              <span>Folder</span>
            </>
          )}
        </span>

        {externalCount > 0 && (
          <span
            title={`${externalCount} external knowledge connections`}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          >
            <Network className="h-2.5 w-2.5" />
            <span>{externalCount}</span>
          </span>
        )}
      </div>

      {/* Folder Title */}
      <div className="flex items-start gap-2 mb-2">
        <Folder className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <h4 className="text-xs font-semibold text-foreground leading-tight truncate">
          {data.title || 'Untitled Folder'}
        </h4>
      </div>

      {/* Footer Info: child count & quick action */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
        <span>{childCount} {childCount === 1 ? 'item' : 'items'}</span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleConnect}
            title="Connect to another note or folder"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Network className="h-3 w-3" />
          </button>
          {!isScopeFolder && (
            <button
              type="button"
              onClick={handleOpenGraph}
              title="Open Folder Graph"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-medium text-[10px]"
            >
              <span>Explore</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-amber-500"
      />
    </div>
  );
});

FolderNode.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    type: PropTypes.string,
    childCount: PropTypes.number,
    externalConnectionCount: PropTypes.number,
    isScopeFolder: PropTypes.bool,
    onOpenFolderGraph: PropTypes.func,
    onConnectNode: PropTypes.func,
  }).isRequired,
  selected: PropTypes.bool,
};
