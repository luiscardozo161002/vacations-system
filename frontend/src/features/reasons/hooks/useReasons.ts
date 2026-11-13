import { sdk } from '../../../lib/sdk';
import { useApiQuery } from '../../../lib/use-api-query';

export function useReasons() {
  const { data, error } = useApiQuery(['reasons', 'active'], (signal) =>
    sdk.reasons.list({ status: 'active', pageSize: 100 }, { signal }),
  );
  return { reasons: data?.data ?? [], error };
}
