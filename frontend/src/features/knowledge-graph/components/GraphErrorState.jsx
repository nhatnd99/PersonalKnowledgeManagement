import PropTypes from 'prop-types';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

/**
 * Clean, user-friendly error component for Knowledge Graph.
 * Displayed when a folder ID is not found (e.g. deleted or stale URL) or API fails,
 * providing actionable recovery paths rather than leaving the canvas broken.
 */
export function GraphErrorState({
  error,
  folderId,
  onNavigateRoot,
  onRetry,
}) {
  const isNotFound = typeof error === 'string' && error.toLowerCase().includes('not found');

  return (
    <div className="h-full w-full flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-8 shadow-xl text-center space-y-4 animate-in fade-in-50 duration-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">
            {isNotFound ? 'Folder Not Found' : 'Failed to Load Knowledge Graph'}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isNotFound
              ? `The folder (${folderId || 'specified'}) may have been deleted, moved, or the link is outdated.`
              : error || 'An unexpected error occurred while loading graph connections.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          )}

          {onNavigateRoot && (
            <button
              type="button"
              onClick={onNavigateRoot}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-xs"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Go to Root Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

GraphErrorState.propTypes = {
  error: PropTypes.string,
  folderId: PropTypes.string,
  onNavigateRoot: PropTypes.func.isRequired,
  onRetry: PropTypes.func,
};
