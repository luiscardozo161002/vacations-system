import { sdk } from '../../../lib/sdk';
import { useApiQuery } from '../../../lib/use-api-query';

export function useBranches(enabled = true) {
  const { data, error } = useApiQuery(
    ['branches', 'active'],
    (signal) => sdk.branches.list({ status: 'active', pageSize: 100 }, { signal }),
    enabled,
  );
  return { branches: data?.data ?? [], error };
}
