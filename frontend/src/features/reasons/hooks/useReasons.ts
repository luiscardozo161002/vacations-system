import { useEffect, useState } from 'react';
import type { Reason } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';

export function useReasons() {
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    sdk.reasons
      .list({ status: 'active', pageSize: 100 }, { signal: controller.signal })
      .then((result) => setReasons(result.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
      });

    return () => controller.abort();
  }, []);

  return { reasons, error };
}
