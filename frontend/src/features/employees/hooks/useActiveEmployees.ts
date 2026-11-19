import { sdk } from '../../../lib/sdk';
import { listAll } from '../../../lib/list-all';
import { useApiQuery } from '../../../lib/use-api-query';

export function useActiveEmployees(enabled = true) {
  const { data, error } = useApiQuery(
    ['employees', 'active'],
    (signal) => listAll(sdk.employees, { status: 'active' as const, sort: 'employee_name' }, signal),
    enabled,
  );
  return { employees: data ?? [], error };
}
