import PropTypes from 'prop-types';
import { Network, Layers, Filter } from 'lucide-react';

const RELATIONSHIP_FILTERS = [
  { value: '', label: 'All Relationships' },
  { value: 'RELATED_TO', label: 'Related To' },
  { value: 'DEPENDS_ON', label: 'Depends On' },
  { value: 'REFERENCES', label: 'References' },
  { value: 'EXTENDS', label: 'Extends' },
  { value: 'CONTRADICTS', label: 'Contradicts' },
];

/**
 * Top floating toolbar with filters and display options for the Knowledge Graph.
 */
export function GraphToolbar({
  relationshipType,
  onRelationshipTypeChange,
  includeHierarchy,
  onToggleHierarchy,
  nodeCount,
  edgeCount,
}) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/90 p-2 shadow-lg backdrop-blur-md text-xs">
      {/* Title & Stats */}
      <div className="flex items-center gap-1.5 px-2 py-1 font-semibold text-foreground border-r border-border pr-3">
        <Network className="h-4 w-4 text-primary" />
        <span>Graph View</span>
        <span className="text-[11px] font-normal text-muted-foreground ml-1">
          ({nodeCount} nodes, {edgeCount} edges)
        </span>
      </div>

      {/* Relationship Type Filter */}
      <div className="flex items-center gap-1.5 pl-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <select
          value={relationshipType}
          onChange={(e) => onRelationshipTypeChange(e.target.value)}
          className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {RELATIONSHIP_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Include Hierarchy toggle */}
      <button
        type="button"
        onClick={onToggleHierarchy}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
          includeHierarchy
            ? 'bg-primary/10 border-primary text-primary font-medium'
            : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Layers className="h-3.5 w-3.5" />
        <span>Hierarchy Links</span>
      </button>
    </div>
  );
}

GraphToolbar.propTypes = {
  relationshipType: PropTypes.string.isRequired,
  onRelationshipTypeChange: PropTypes.func.isRequired,
  includeHierarchy: PropTypes.bool.isRequired,
  onToggleHierarchy: PropTypes.func.isRequired,
  nodeCount: PropTypes.number.isRequired,
  edgeCount: PropTypes.number.isRequired,
};
