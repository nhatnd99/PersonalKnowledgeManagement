import { AUTO_SAVE_STATUS } from '../constants/index.js';

/**
 * Visual indicator displaying current auto-save state.
 * @param {Object} props
 * @param {string} props.status - 'idle' | 'saving' | 'saved' | 'error'
 * @param {Date|null} props.lastSavedAt
 */
export function AutoSaveIndicator({ status, lastSavedAt }) {
  if (status === AUTO_SAVE_STATUS.SAVING) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span>Saving...</span>
      </div>
    );
  }

  if (status === AUTO_SAVE_STATUS.SAVED) {
    const timeString = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : '';
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>Saved {timeString && `at ${timeString}`}</span>
      </div>
    );
  }

  if (status === AUTO_SAVE_STATUS.ERROR) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <span className="h-2 w-2 rounded-full bg-destructive" />
        <span>Save failed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
      <span>All changes saved</span>
    </div>
  );
}
