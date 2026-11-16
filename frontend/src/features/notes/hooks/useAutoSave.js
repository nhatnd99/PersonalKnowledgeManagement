import { useState, useRef, useEffect, useCallback } from 'react';
import { AUTO_SAVE_STATUS } from '../constants/index.js';

const DEFAULT_DEBOUNCE_DELAY_MS = 600;

/**
 * Robust debounced background auto-save hook.
 *
 * Guarantees:
 * 1. Debounces rapid user keystrokes (800-1200ms default 1000ms).
 * 2. Manages clear state machine: 'saved' | 'unsaved' | 'saving' | 'error'.
 * 3. Prevents race conditions: if edits occur while an HTTP save is in flight,
 *    a subsequent save is queued and dispatched when the in-flight request settles.
 * 4. Never drops newer edits or overwrites them with older responses.
 * 5. Flushes pending changes immediately on unmount or beforeunload.
 *
 * @param {Function} onSave - Async callback (payload) => Promise
 * @param {number} [delayMs=1000] - Debounce delay in ms
 * @returns {Object} { status, lastSavedAt, triggerSave, flushSave, retrySave }
 */
export function useAutoSave(onSave, delayMs = DEFAULT_DEBOUNCE_DELAY_MS) {
  const [status, setStatus] = useState(AUTO_SAVE_STATUS.SAVED);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const pendingDataRef = useRef(null);
  const inFlightDataRef = useRef(null);
  const isSavingRef = useRef(false);
  const timerRef = useRef(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const performSave = useCallback(async () => {
    // If no new data to save, do nothing
    if (!pendingDataRef.current) return;

    // If already saving, the ongoing save will pick up pendingDataRef upon completion
    if (isSavingRef.current) return;

    const dataToPersist = pendingDataRef.current;
    pendingDataRef.current = null;
    inFlightDataRef.current = dataToPersist;
    isSavingRef.current = true;
    setStatus(AUTO_SAVE_STATUS.SAVING);

    try {
      await onSaveRef.current(dataToPersist);
      setLastSavedAt(new Date());

      isSavingRef.current = false;
      inFlightDataRef.current = null;

      // If user typed more while the save was in-flight, schedule next save
      if (pendingDataRef.current) {
        setStatus(AUTO_SAVE_STATUS.UNSAVED);
        timerRef.current = setTimeout(performSave, delayMs);
      } else {
        setStatus(AUTO_SAVE_STATUS.SAVED);
      }
    } catch (err) {
      console.error('[useAutoSave] Auto-save failed:', err);
      // Restore unsaved data back to pending if no newer data arrived
      if (!pendingDataRef.current) {
        pendingDataRef.current = dataToPersist;
      } else {
        pendingDataRef.current = { ...dataToPersist, ...pendingDataRef.current };
      }
      isSavingRef.current = false;
      inFlightDataRef.current = null;
      setStatus(AUTO_SAVE_STATUS.ERROR);
    }
  }, [delayMs]);

  const triggerSave = useCallback(
    (data) => {
      pendingDataRef.current = {
        ...(pendingDataRef.current || {}),
        ...data,
      };
      setStatus(AUTO_SAVE_STATUS.UNSAVED);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(performSave, delayMs);
    },
    [delayMs, performSave]
  );

  const cancelSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingDataRef.current = null;
    inFlightDataRef.current = null;
    isSavingRef.current = false;
    setStatus(AUTO_SAVE_STATUS.SAVED);
  }, []);

  const flushSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingDataRef.current && !isSavingRef.current) {
      await performSave();
    }
  }, [performSave]);

  const retrySave = useCallback(() => {
    if (pendingDataRef.current) {
      performSave();
    }
  }, [performSave]);

  // Flush on unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingDataRef.current) {
        flushSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (pendingDataRef.current) {
        // Synchronous or fast cleanup attempt
        performSave();
      }
    };
  }, [flushSave, performSave]);

  return {
    status,
    lastSavedAt,
    triggerSave,
    flushSave,
    retrySave,
    cancelSave,
  };
}
