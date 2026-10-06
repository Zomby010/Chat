import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data from the API with loading/error state and a reload function.
 * Ignores results from stale requests (e.g. after navigating away).
 */
export function useApiData(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const seq = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await run();
      if (id === seq.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === seq.current) setState((s) => ({ ...s, error, loading: false }));
    }
  }, [run]);

  useEffect(() => {
    reload();
    return () => {
      seq.current++;
    };
  }, [reload]);

  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);
  return { ...state, reload, setData };
}
