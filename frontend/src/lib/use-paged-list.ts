import { useCallback, useEffect, useState } from 'react';
import type { CallOptions, Paginated } from '@vacations/sdk';
import { getErrorMessage } from './get-error-message';

export function usePagedList<T, P>(load: (params: P, options: CallOptions) => Promise<Paginated<T>>, params: P) {
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    load(params, { signal: controller.signal })
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [load, params, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return { data, loading, error, reload };
}
