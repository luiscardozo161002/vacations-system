import { config } from '../config';
import type { Listable } from '../hooks/use-paged-list';

export const listAll = async <T, P extends object>(resource: Listable<T, P & { page: number; pageSize: number }>, params: P, signal: AbortSignal): Promise<T[]> => {
  const { catalogPageSize } = config;
  const first = await resource.list({ ...params, page: 1, pageSize: catalogPageSize }, { signal });
  const rest = await Promise.all(
    Array.from({ length: first.pagination.totalPages - 1 }, (_, index) =>
      resource.list({ ...params, page: index + 2, pageSize: catalogPageSize }, { signal }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data);
};
