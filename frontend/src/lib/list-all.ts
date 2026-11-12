import type { CallOptions, Paginated } from '@vacations/sdk';

const PAGE_SIZE = 100;

export const listAll = async <T, P extends object>(
  load: (params: P & { page: number; pageSize: number }, options: CallOptions) => Promise<Paginated<T>>,
  params: P,
  signal: AbortSignal,
): Promise<T[]> => {
  const first = await load({ ...params, page: 1, pageSize: PAGE_SIZE }, { signal });
  const rest = await Promise.all(
    Array.from({ length: first.pagination.totalPages - 1 }, (_, index) =>
      load({ ...params, page: index + 2, pageSize: PAGE_SIZE }, { signal }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data);
};
