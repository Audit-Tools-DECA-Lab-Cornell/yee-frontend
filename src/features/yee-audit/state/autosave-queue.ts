"use client";

import * as React from "react";

export type SaveStatus = "idle" | "saving" | "error";

export type AutosaveQueueResult<T> = {
  /** Current save status. */
  saveStatus: SaveStatus;
  /** Timestamp of the last successful save, or null if never saved. */
  lastSavedAt: Date | null;
  /** Human-readable error message from the most recent failed save, or null. */
  lastSaveError: string | null;
  /** Enqueues new data to save. Calling this while a save is in flight defers
   *  the save until the current one completes; only the latest value is kept. */
  enqueue: (data: T) => void;
};

/**
 * useAutosaveQueue
 *
 * Guarantees that concurrent autosaves never race and overwrite each other.
 *
 * Invariants:
 * - At most one `saveFn` call is in flight at any time.
 * - If `enqueue` is called while a save is in flight, the newest data is
 *   stored and another save starts immediately after the current one finishes.
 * - Unmounting cancels any pending follow-up save (the in-flight fetch cannot
 *   be cancelled but its result will be ignored).
 */
export function useAutosaveQueue<T>(
  saveFn: (data: T) => Promise<void>
): AutosaveQueueResult<T> {
  const saveFnRef = React.useRef(saveFn);
  React.useEffect(() => {
    saveFnRef.current = saveFn;
  });

  /** Latest data waiting to be saved. null means nothing is pending. */
  const pendingRef = React.useRef<{ data: T } | null>(null);
  /** Whether a save is currently in flight. */
  const inFlightRef = React.useRef(false);
  /** Whether the component has unmounted. */
  const unmountedRef = React.useRef(false);

  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [lastSaveError, setLastSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  /** Recursively drains the pending queue after each save completes. */
  const drainQueue = React.useCallback(async (): Promise<void> => {
    while (pendingRef.current !== null) {
      const { data } = pendingRef.current;
      pendingRef.current = null;
      inFlightRef.current = true;

      if (!unmountedRef.current) setSaveStatus("saving");

      try {
        await saveFnRef.current(data);
        if (!unmountedRef.current) {
          setSaveStatus("idle");
          setLastSavedAt(new Date());
          setLastSaveError(null);
        }
      } catch (error) {
        if (!unmountedRef.current) {
          setSaveStatus("error");
          setLastSaveError(
            error instanceof Error ? error.message : "Failed to save."
          );
        }
      }

      inFlightRef.current = false;
    }
  }, []);

  const enqueue = React.useCallback(
    (data: T): void => {
      pendingRef.current = { data };
      if (!inFlightRef.current) {
        void drainQueue();
      }
    },
    [drainQueue]
  );

  return { saveStatus, lastSavedAt, lastSaveError, enqueue };
}
