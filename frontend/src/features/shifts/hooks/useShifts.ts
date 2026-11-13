import { sdk } from '../../../lib/sdk';
import { useApiQuery } from '../../../lib/use-api-query';

export function useShifts() {
  const { data, error } = useApiQuery(['shifts', 'all'], (signal) => sdk.shifts.list({ pageSize: 100 }, { signal }));
  return { shifts: data?.data ?? [], error };
}
