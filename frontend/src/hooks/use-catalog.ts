import { config } from '../config';
import { useApiQuery } from './use-api-query';
import type { Listable } from './use-paged-list';

export function useCatalog<T, P extends object>(key: string, resource: Listable<T, P & { pageSize: number }>, params: P, enabled = true) {
  const { data, error } = useApiQuery(
    [key, params],
    (signal) => resource.list({ ...params, pageSize: config.catalogPageSize }, { signal }),
    enabled,
  );
  return { items: data?.data ?? [], error };
}
