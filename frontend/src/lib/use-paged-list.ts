import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CallOptions, Paginated } from '@vacations/sdk';
import { getErrorMessage } from './get-error-message';

export function usePagedList<T, P>(
  key: string,
  load: (params: P, options: CallOptions) => Promise<Paginated<T>>,
  params: P,
) {
  const query = useQuery({
    queryKey: [key, params],
    queryFn: ({ signal }) => load(params, { signal }),
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
