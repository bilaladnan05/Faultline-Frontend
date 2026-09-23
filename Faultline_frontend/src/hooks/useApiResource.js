import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_POLL_MS = Number((import.meta.env ?? {}).VITE_API_POLL_MS || 15000);

/**
 * Fetches one API resource, with polling for the live views.
 *
 * Deliberately small rather than a query library: the app has one consumer per endpoint
 * and no cross-page cache to invalidate. The two behaviours that do matter are here —
 * a refetch never clears data that is already on screen (so a poll cannot make a live
 * table blink), and an in-flight request is aborted when its inputs change or the
 * component unmounts (so a slow response cannot overwrite a newer one).
 *
 * @param fetcher      receives `{ signal }`; its result becomes `data`
 * @param deps         re-runs when these change, like useEffect. Compared by value, so
 *                     they must be JSON-serialisable primitives — pass IDs, not objects
 * @param options.pollMs   poll interval in ms; 0 disables. Defaults to no polling
 * @param options.enabled  false leaves the hook idle
 * @param options.paused   true keeps the current data but stops polling
 */
export function useApiResource(fetcher, deps = [], options = {}) {
  const { pollMs = 0, enabled = true, paused = false } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loadingState, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetcherRef = useRef(fetcher);
  const abortRef = useRef(null);
  const hasDataRef = useRef(false);

  // Kept current without touching the ref during render, so `run` can stay stable
  // while still calling the latest closure.
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // The deps are compared by value: a caller passing an inline array of IDs would
  // otherwise rebuild `run` on every render.
  const depsKey = JSON.stringify(deps);

  const run = useCallback(async () => {
    if (!enabled) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // First load shows a skeleton; later loads are background refreshes.
    if (hasDataRef.current) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetcherRef.current({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setData(result ?? null);
      hasDataRef.current = result !== null && result !== undefined;
      setError(null);
      setUpdatedAt(new Date());
    } catch (caught) {
      if (controller.signal.aborted || caught?.name === "AbortError") return;
      setError(caught);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // depsKey is the caller's deps compared by value; the linter cannot see through the
    // serialisation and reads it as unused.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, depsKey]);

  useEffect(() => {
    if (!enabled) return undefined;
    run();
    return () => abortRef.current?.abort();
  }, [run, enabled]);

  useEffect(() => {
    if (!enabled || paused || !pollMs) return undefined;
    const timer = setInterval(run, pollMs);
    return () => clearInterval(timer);
  }, [run, enabled, paused, pollMs]);

  return {
    data,
    error,
    // A disabled hook is idle, not loading — it never had a request to wait for.
    loading: enabled ? loadingState : false,
    refreshing,
    updatedAt,
    refetch: run,
  };
}

/** Poll interval for live views, so pages do not each hardcode one. */
export const livePollMs = DEFAULT_POLL_MS;
