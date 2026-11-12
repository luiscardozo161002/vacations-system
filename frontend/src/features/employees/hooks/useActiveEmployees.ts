import { useEffect, useState } from 'react';
import type { Employee } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';

const PAGE_SIZE = 100;

const loadAll = async (signal: AbortSignal): Promise<Employee[]> => {
  const params = { status: 'active' as const, pageSize: PAGE_SIZE, sort: 'employee_name' };
  const first = await sdk.employees.list({ ...params, page: 1 }, { signal });
  const rest = await Promise.all(
    Array.from({ length: first.pagination.totalPages - 1 }, (_, index) =>
      sdk.employees.list({ ...params, page: index + 2 }, { signal }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data);
};

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
