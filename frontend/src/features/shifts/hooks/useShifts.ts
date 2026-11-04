import { useEffect, useState } from 'react';
import type { Shift } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    sdk.shifts
      .list({ pageSize: 100 }, { signal: controller.signal })
      .then((result) => setShifts(result.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
      });

    return () => controller.abort();
  }, []);

  return { shifts, error };
}
