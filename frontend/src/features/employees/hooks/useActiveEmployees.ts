import { sdk } from '../../../services/sdk';
import { listAll } from '../../../utils/list-all';
import { useApiQuery } from '../../../hooks/use-api-query';

export function useActiveEmployees(enabled = true) {
  const { data, error } = useApiQuery(
    ['employees', 'active'],
    (signal) => listAll(sdk.employees, { status: 'active' as const, sort: 'employee_name' }, signal),
    enabled,
  );
  return { employees: data ?? [], error };
}
