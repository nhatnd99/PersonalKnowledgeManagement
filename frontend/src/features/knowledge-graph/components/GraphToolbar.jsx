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
  Minimize2,
  Home,
  FolderTree,
  Network,
  Globe,
  Focus,
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
  includeKnowledge = true,
  onToggleKnowledge,
  includeExternal = true,
  onToggleExternal,
  isFullscreen = false,
  onToggleFullscreen,
  nodeCount,
  edgeCount,
  onRefresh,
  onFitView,
  onOpenConnectModal,
  foldersList = [],
  onBackToFolderSelection,
}) {
  const isRoot = !scope || scope.id === 'root';

  return (
    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
      {/* Left side: Breadcrumb & Scope title & Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-card/95 px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg backdrop-blur-md pointer-events-auto">
        {onBackToFolderSelection && (
          <button
            type="button"
            onClick={onBackToFolderSelection}
            title="Back to Folder Selection"
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-0.5 sm:mr-1 text-xs font-medium"
          >
            <FolderTree className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Folders</span>
          </button>
        )}

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
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-0.5 sm:mr-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* Quick Folder Switcher Dropdown */}
        {foldersList.length > 0 && (
          <select
            value={scope?.id || 'root'}
            onChange={(e) => onNavigateBreadcrumb(e.target.value)}
            className="rounded-md border border-input bg-background/80 px-1.5 sm:px-2 py-0.5 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring max-w-[110px] sm:max-w-[150px] truncate"
            title="Switch Folder Graph"
          >
            <option value="root">📂 Root Workspace</option>
            {foldersList.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.title} ({f.childCount || 0})
              </option>
            ))}
          </select>
        )}

        {/* Breadcrumb path */}
        <nav aria-label="Graph Scope Breadcrumbs" className="hidden md:flex items-center gap-1.5 text-xs">
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
        <div className="ml-1 sm:ml-2 pl-1.5 sm:pl-2 border-l border-border text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap">
          <span>{nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}, {edgeCount} {edgeCount === 1 ? 'edge' : 'edges'}</span>
        </div>
      </div>

      {/* Right side: Controls & Tools */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 rounded-xl border border-border bg-card/95 p-1 sm:p-1.5 shadow-lg backdrop-blur-md text-xs pointer-events-auto">
        {/* Relationship Type Filter */}
        <div className="flex items-center gap-1 px-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={relationshipType}
            onChange={(e) => onRelationshipTypeChange(e.target.value)}
            disabled={!includeKnowledge}
            className="rounded-md border border-input bg-background px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring max-w-[95px] sm:max-w-none truncate disabled:opacity-50"
            title="Filter by relationship type"
          >
            {RELATIONSHIP_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Knowledge Links Toggle */}
        {onToggleKnowledge && (
          <button
            type="button"
            onClick={onToggleKnowledge}
            title={includeKnowledge ? 'Hide knowledge relationships' : 'Show knowledge relationships'}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors ${
              includeKnowledge
                ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Knowledge Links</span>
          </button>
        )}

        {/* Include Hierarchy toggle */}
        <button
          type="button"
          onClick={onToggleHierarchy}
          title={includeHierarchy ? 'Hide hierarchy links' : 'Show direct parent-child hierarchy links'}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors ${
            includeHierarchy
              ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-medium'
              : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Hierarchy</span>
        </button>

        {/* External Nodes toggle */}
        {!isRoot && onToggleExternal && (
          <button
            type="button"
            onClick={onToggleExternal}
            title={includeExternal ? 'Hide external connected nodes' : 'Show external connected nodes'}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors ${
              includeExternal
                ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-medium'
                : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">External Nodes</span>
          </button>
        )}

        {/* Connect Nodes Button */}
        {onOpenConnectModal && (
          <button
            type="button"
            onClick={onOpenConnectModal}
            title="Create semantic relationship between items"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connect</span>
          </button>
        )}

        {/* Fit View */}
        {onFitView && (
          <button
            type="button"
            onClick={onFitView}
            title="Fit graph to view"
            className="p-1 sm:p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Focus className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit full screen' : 'View full screen'}
            className="p-1 sm:p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh graph data"
            className="p-1 sm:p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
  includeKnowledge: PropTypes.bool,
  onToggleKnowledge: PropTypes.func,
  includeExternal: PropTypes.bool,
  onToggleExternal: PropTypes.func,
  isFullscreen: PropTypes.bool,
  onToggleFullscreen: PropTypes.func,
  nodeCount: PropTypes.number.isRequired,
  edgeCount: PropTypes.number.isRequired,
  onRefresh: PropTypes.func,
  onFitView: PropTypes.func,
  onOpenConnectModal: PropTypes.func,
  foldersList: PropTypes.array,
  onBackToFolderSelection: PropTypes.func,
};

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
  foldersList: PropTypes.array,
  onBackToFolderSelection: PropTypes.func,
};
