import { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { FileText, Folder, Star } from 'lucide-react';

/**
 * Custom React Flow node representing a knowledge note or folder.
 */
export const NoteNode = memo(function NoteNode({ data, selected }) {
  const isFolder = data.type === 'FOLDER';

  return (
    <div
      className={`relative min-w-[160px] max-w-[220px] rounded-lg border bg-card px-3 py-2.5 shadow-md transition-all ${
        selected
          ? 'border-primary ring-2 ring-primary/40 shadow-primary/10'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-background !bg-primary"
      />

      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {isFolder ? (
            <Folder className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-primary shrink-0" />
          )}
          <span className="text-xs font-semibold text-foreground truncate block">
            {data.title || 'Untitled Note'}
          </span>
        </div>

        {data.isFavorite && (
          <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
        )}
      </div>

      {/* Tag indicator dots */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2 pt-1 border-t border-border/40">
          {data.tags.slice(0, 4).map((tag) => (
            <span
              key={tag.id}
              title={`#${tag.name}`}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: tag.color || '#3b82f6' }}
            />
          ))}
          {data.tags.length > 4 && (
            <span className="text-[9px] text-muted-foreground">+{data.tags.length - 4}</span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-background !bg-primary"
      />
    </div>
  );
});

NoteNode.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string,
    type: PropTypes.string,
    isFavorite: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  selected: PropTypes.bool,
};
