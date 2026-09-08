import { useEffect, useState } from 'react';

/**
 * Simulates the loading state of an API call so screens can show skeletons.
 * `deps` re-triggers the delay (e.g. when a filter changes).
 */
export function useSimulatedLoad(ms = 450, deps: unknown[] = []): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return loading;
}
