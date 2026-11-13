import { sdk } from '../../../lib/sdk';
import { useApiQuery } from '../../../lib/use-api-query';

export function useDepartments(enabled = true) {
  const { data, error } = useApiQuery(
    ['departments', 'all'],
    (signal) => sdk.departments.list({ pageSize: 100 }, { signal }),
    enabled,
  );
  return { departments: data?.data ?? [], error };
}
