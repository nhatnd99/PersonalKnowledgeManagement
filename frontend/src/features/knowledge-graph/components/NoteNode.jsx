import { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { FileText, Star, Network, ExternalLink, MoreHorizontal } from 'lucide-react';

/**
 * Custom React Flow node representing a knowledge note.
 * Features primary styling, tag indicators, external connection count, and quick actions.
 */
export const NoteNode = memo(function NoteNode({ data, selected }) {
  const isExternal = Boolean(data.isExternal);
  const externalCount = data.externalConnectionCount || 0;

  const handleOpenNote = (e) => {
    e.stopPropagation();
    if (data.onOpenNote) {
      data.onOpenNote(data.id);
    }
  };

  const handleConnect = (e) => {
    e.stopPropagation();
    if (data.onConnectNode) {
      data.onConnectNode(data);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.onNodeContextMenu) {
      data.onNodeContextMenu(e, data);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (data.onNodeContextMenu) {
      const rect = e.currentTarget.getBoundingClientRect();
      data.onNodeContextMenu(
        { clientX: rect.left, clientY: rect.bottom + 4, preventDefault: () => {} },
        data
      );
    }
  };

  return (
    <div
      onDoubleClick={handleOpenNote}
      onContextMenu={handleContextMenu}
      className={`relative min-w-[170px] max-w-[230px] rounded-xl border bg-card p-3 shadow-md transition-all cursor-pointer ${
        isExternal
          ? 'border-dashed border-muted-foreground/60 bg-muted/20 opacity-85 hover:opacity-100'
          : selected
          ? 'border-primary ring-2 ring-primary/40 shadow-primary/10 shadow-lg'
          : 'border-border hover:border-primary/50 hover:shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary"
      />

      {/* Top Header: Note tag & External indicator & 3-dots action menu */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
          <FileText className="h-3 w-3" />
          <span>Note</span>
        </span>

        <div className="flex items-center gap-1">
          {isExternal && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border">
              External
            </span>
          )}
          {data.isFavorite && (
            <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
          )}
          {externalCount > 0 && !isExternal && (
            <span
              title={`${externalCount} external knowledge connections`}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
            >
              <Network className="h-2.5 w-2.5" />
              <span>{externalCount}</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleMenuClick}
            aria-label="Node options"
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-0.5"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Note Title */}
      <div className="flex items-start gap-1.5 mb-2">
        <span className="text-xs font-semibold text-foreground truncate block leading-tight">
          {data.title || 'Untitled Note'}
        </span>
      </div>

      {/* Tag indicator dots */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          {data.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              title={`#${tag.name}`}
              className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tag.color || '#3b82f6' }}
              />
              <span className="truncate max-w-[60px]">{tag.name}</span>
            </span>
          ))}
          {data.tags.length > 3 && (
            <span className="text-[9px] text-muted-foreground">+{data.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
        <button
          type="button"
          onClick={handleConnect}
          title="Connect to another note or folder"
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <Network className="h-3 w-3" />
          <span className="text-[10px]">Connect</span>
        </button>

        <button
          type="button"
          onClick={handleOpenNote}
          title="Open in Editor"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium text-[10px]"
        >
          <span>Open</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary"
      />
    </div>
  );
});

NoteNode.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    type: PropTypes.string,
    isFavorite: PropTypes.bool,
    externalConnectionCount: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.object),
    onOpenNote: PropTypes.func,
    onConnectNode: PropTypes.func,
  }).isRequired,
  selected: PropTypes.bool,
};
