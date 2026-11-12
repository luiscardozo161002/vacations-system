import { useEffect, useState } from 'react';
import type { Employee } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { listAll } from '../../../lib/list-all';

const loadAll = (signal: AbortSignal): Promise<Employee[]> =>
  listAll((params, options) => sdk.employees.list(params, options), { status: 'active' as const, sort: 'employee_name' }, signal);

export function useActiveEmployees(enabled = true) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    loadAll(controller.signal)
      .then(setEmployees)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
      });

    return () => controller.abort();
  }, [enabled]);

  return { employees, error };
}
