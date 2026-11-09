import PropTypes from 'prop-types';
import {
  Layers,
  Filter,
  ChevronRight,
  Folder,
  FolderOpen,
  ArrowLeft,
  RotateCw,
  Plus,
  Maximize2,
  Home,
} from 'lucide-react';

const RELATIONSHIP_FILTERS = [
  { value: '', label: 'All Relationships' },
  { value: 'RELATED_TO', label: 'Related To' },
  { value: 'DEPENDS_ON', label: 'Depends On' },
  { value: 'REFERENCES', label: 'References' },
  { value: 'EXTENDS', label: 'Extends' },
  { value: 'CONTRADICTS', label: 'Contradicts' },
];

/**
 * Top floating toolbar with breadcrumbs, filters, actions and display options for the Folder-Based Knowledge Graph.
 */
export function GraphToolbar({
  scope,
  breadcrumbs = [],
  onNavigateBreadcrumb,
  relationshipType,
  onRelationshipTypeChange,
  includeHierarchy,
  onToggleHierarchy,
  nodeCount,
  edgeCount,
  onRefresh,
  onFitView,
  onOpenConnectModal,
}) {
  const isRoot = !scope || scope.id === 'root';

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      {/* Left side: Breadcrumb & Scope title */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-md pointer-events-auto">
        {!isRoot && (
          <button
            type="button"
            onClick={() => {
              if (breadcrumbs.length > 1) {
                const parent = breadcrumbs[breadcrumbs.length - 2];
                onNavigateBreadcrumb(parent.id);
              } else {
                onNavigateBreadcrumb('root');
              }
            }}
            title="Go to parent folder graph"
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* Breadcrumb path */}
        <nav aria-label="Graph Scope Breadcrumbs" className="flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const isCrumbRoot = crumb.id === 'root';

            return (
              <div key={crumb.id || idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
                {isLast ? (
                  <span className="flex items-center gap-1 font-semibold text-foreground px-1 py-0.5 rounded bg-muted/60">
                    {isCrumbRoot ? (
                      <Home className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span>{crumb.title}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigateBreadcrumb(crumb.id)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded hover:bg-muted"
                  >
                    {isCrumbRoot ? (
                      <Home className="h-3.5 w-3.5" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 text-amber-500/80" />
                    )}
                    <span>{crumb.title}</span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Stats */}
        <div className="ml-2 pl-2 border-l border-border text-[11px] text-muted-foreground">
          <span>{nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}, {edgeCount} {edgeCount === 1 ? 'edge' : 'edges'}</span>
        </div>
      </div>

      {/* Right side: Controls & Tools */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md text-xs pointer-events-auto">
        {/* Relationship Type Filter */}
        <div className="flex items-center gap-1 px-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={relationshipType}
            onChange={(e) => onRelationshipTypeChange(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
          title="Toggle direct parent-to-child hierarchy links"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            includeHierarchy
              ? 'bg-primary/10 border-primary text-primary font-medium'
              : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Hierarchy Links</span>
        </button>

        {/* Connect Nodes Button */}
        {onOpenConnectModal && (
          <button
            type="button"
            onClick={onOpenConnectModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect</span>
          </button>
        )}

        {/* Fit View */}
        {onFitView && (
          <button
            type="button"
            onClick={onFitView}
            title="Fit graph view"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh graph data"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

GraphToolbar.propTypes = {
  scope: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
  }),
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
    })
  ),
  onNavigateBreadcrumb: PropTypes.func.isRequired,
  relationshipType: PropTypes.string.isRequired,
  onRelationshipTypeChange: PropTypes.func.isRequired,
  includeHierarchy: PropTypes.bool.isRequired,
  onToggleHierarchy: PropTypes.func.isRequired,
  nodeCount: PropTypes.number.isRequired,
  edgeCount: PropTypes.number.isRequired,
  onRefresh: PropTypes.func,
  onFitView: PropTypes.func,
  onOpenConnectModal: PropTypes.func,
};
