import PropTypes from 'prop-types';
import { AUTO_SAVE_STATUS } from '../constants/index.js';

/**
 * Subtle visual indicator displaying current auto-save state without shifting layout.
 * @param {Object} props
 * @param {'unsaved'|'saving'|'saved'|'error'} props.status
 * @param {Date|null} props.lastSavedAt
 * @param {Function} [props.onRetry]
 */
export function AutoSaveIndicator({ status, lastSavedAt, onRetry }) {
  if (status === AUTO_SAVE_STATUS.SAVING) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
        <span>Saving...</span>
      </div>
    );
  }

  if (status === AUTO_SAVE_STATUS.UNSAVED) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
        <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (status === AUTO_SAVE_STATUS.SAVED) {
    const timeString = lastSavedAt
      ? new Date(lastSavedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '';
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        <span>Saved {timeString && `at ${timeString}`}</span>
      </div>
    );
  }

  if (status === AUTO_SAVE_STATUS.ERROR) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
        <span>Save failed</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="underline hover:text-destructive/80 ml-1 font-medium text-[11px]"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
      <span>Saved</span>
    </div>
  );
}

AutoSaveIndicator.propTypes = {
  status: PropTypes.string,
  lastSavedAt: PropTypes.instanceOf(Date),
  onRetry: PropTypes.func,
};
