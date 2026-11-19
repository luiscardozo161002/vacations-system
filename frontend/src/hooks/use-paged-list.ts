import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CallOptions, Paginated } from '@vacations/sdk';
import { getErrorMessage } from '../utils/get-error-message';

export interface Listable<T, P> {
  list(params: P, options: CallOptions): Promise<Paginated<T>>;
}

export function usePagedList<T, P>(key: string, resource: Listable<T, P>, params: P) {
  const query = useQuery({
    queryKey: [key, params],
    queryFn: ({ signal }) => resource.list(params, { signal }),
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
