import PropTypes from 'prop-types';
import { Sparkles, FilePlus, FolderPlus } from 'lucide-react';
import { NOTE_TYPES } from '../../../constants/index.js';

/**
 * Context-aware empty state overlay for Knowledge Graph.
 * Distinguishes between an empty root workspace and an empty folder,
 * allowing instant creation of notes or subfolders right from the canvas.
 */
export function GraphEmptyState({ isFolder, folderTitle, onCreateChild }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="rounded-2xl border border-border bg-card/95 p-8 text-center max-w-sm shadow-2xl pointer-events-auto backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
          <Sparkles className="h-6 w-6" />
        </div>

        <h3 className="text-base font-semibold text-foreground">
          {isFolder ? `"${folderTitle || 'Folder'}" is empty` : 'Workspace is empty'}
        </h3>

        <p className="text-xs text-muted-foreground mt-1 mb-5 leading-relaxed">
          {isFolder
            ? 'This folder does not contain any direct notes or subfolders yet.'
            : 'Create root-level notes and folders to begin building your knowledge graph.'}
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onCreateChild(NOTE_TYPES.NOTE)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <FilePlus className="h-3.5 w-3.5" />
            <span>Create Note</span>
          </button>

          <button
            type="button"
            onClick={() => onCreateChild(NOTE_TYPES.FOLDER)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition-colors shadow-xs"
          >
            <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
            <span>Create Subfolder</span>
          </button>
        </div>
      </div>
    </div>
  );
}

GraphEmptyState.propTypes = {
  isFolder: PropTypes.bool,
  folderTitle: PropTypes.string,
  onCreateChild: PropTypes.func.isRequired,
};
