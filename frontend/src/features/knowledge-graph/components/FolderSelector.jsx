import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { graphService } from '../services/graphService.js';
import {
  Folder,
  Search,
  ArrowRight,
  FolderTree,
  Sparkles,
  Home,
  RefreshCw,
} from 'lucide-react';

/**
 * FolderSelector: Beautiful landing screen for Knowledge Graph when no folder is yet selected.
 * Allows searching and choosing which folder's knowledge graph to explore.
 */
export function FolderSelector({ onSelectFolder }) {
  const [folders, setFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFolders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await graphService.getFoldersList();
      setFolders(data.folders || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const filteredFolders = folders.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.title || '').toLowerCase().includes(q) ||
      (f.path || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full w-full overflow-y-auto bg-background p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
            <FolderTree className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Folder-Centric Knowledge Graph
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Choose a folder to explore its central graph, descendants, hierarchy tree, and semantic connections.
          </p>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search folders by name or path..."
              className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onSelectFolder('root')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-xs"
            >
              <Home className="h-3.5 w-3.5 text-primary" />
              <span>Root Workspace</span>
            </button>

            <button
              type="button"
              onClick={fetchFolders}
              title="Refresh folders"
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-xs"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Loading / Error / Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl border border-border bg-card/60 animate-pulse p-5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <h4 className="font-semibold text-foreground text-sm">
              {searchQuery ? 'No matching folders found' : 'No folders found in workspace'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {searchQuery
                ? 'Try a different search term or explore the Root Workspace.'
                : 'Create folders from the sidebar to organize your notes into structured graphs.'}
            </p>
            <button
              type="button"
              onClick={() => onSelectFolder('root')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
            >
              <span>Explore Root Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className="group relative rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-amber-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
                      <Folder className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {folder.childCount} {folder.childCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                    {folder.title || 'Untitled Folder'}
                  </h3>

                  <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1 font-mono">
                    {folder.path}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50 text-xs font-semibold text-primary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  <span>Explore Graph</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

FolderSelector.propTypes = {
  onSelectFolder: PropTypes.func.isRequired,
};
