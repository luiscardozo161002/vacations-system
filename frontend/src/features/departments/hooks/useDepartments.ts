import { useEffect, useState } from 'react';
import type { Department } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';

export function useDepartments(enabled = true) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    sdk.departments
      .list({ pageSize: 100 }, { signal: controller.signal })
      .then((result) => setDepartments(result.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
      });

    return () => controller.abort();
  }, [enabled]);

  return { departments, error };
}
