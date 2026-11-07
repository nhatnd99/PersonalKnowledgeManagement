import { useState, useRef, useEffect, useCallback } from 'react';
import { AUTO_SAVE_STATUS } from '../constants/index.js';
import { AUTO_SAVE_DELAY_MS } from '../../../constants/index.js';

/**
 * Custom hook to manage auto-save debouncing and lifecycle flush on unmount.
 *
 * @param {Function} onSave - Async save function accepting current data
 * @param {number} [delayMs=1500] - Debounce delay in milliseconds
 * @returns {Object} { status, lastSavedAt, triggerSave, flushSave }
 */
export function useAutoSave(onSave, delayMs = AUTO_SAVE_DELAY_MS) {
  const [status, setStatus] = useState(AUTO_SAVE_STATUS.IDLE);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const pendingDataRef = useRef(null);
  const timerRef = useRef(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const performSave = useCallback(async (data) => {
    if (!data) return;
    setStatus(AUTO_SAVE_STATUS.SAVING);
    try {
      await onSaveRef.current(data);
      setStatus(AUTO_SAVE_STATUS.SAVED);
      setLastSavedAt(new Date());
      pendingDataRef.current = null;
    } catch (err) {
      console.error('[useAutoSave] Save failed:', err);
      setStatus(AUTO_SAVE_STATUS.ERROR);
    }
  }, []);

  const triggerSave = useCallback((data) => {
    pendingDataRef.current = data;
    setStatus(AUTO_SAVE_STATUS.IDLE);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      performSave(data);
    }, delayMs);
  }, [delayMs, performSave]);

  const flushSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingDataRef.current) {
      await performSave(pendingDataRef.current);
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
    };
  }, [flushSave]);

  return {
    status,
    lastSavedAt,
    triggerSave,
    flushSave,
  };
}
