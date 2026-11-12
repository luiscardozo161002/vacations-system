import { useCallback, useEffect, useState } from 'react';
import type { ListNoticesParams, Notice, Paginated } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';

export function useNotices(params: ListNoticesParams) {
  const [data, setData] = useState<Paginated<Notice> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    sdk.notices
      .list(params, { signal: controller.signal })
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return { data, loading, error, reload };
}
