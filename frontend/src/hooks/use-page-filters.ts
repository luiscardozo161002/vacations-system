import { useCallback, useMemo } from 'react';
import { useUrlFilters } from './use-url-filters';

export function usePageFilters<T extends Record<string, string>>(defaults: T) {
  type Filters = T & { pagina: string };

  const withPage = useMemo(() => ({ ...defaults, pagina: '1' }) as Filters, [defaults]);
  const [filters, update] = useUrlFilters(withPage);

  const setFilter = useCallback((changes: Partial<T>) => update({ ...changes, pagina: '1' } as Partial<Filters>), [update]);
  const setPage = useCallback((page: number) => update({ pagina: String(page) } as Partial<Filters>), [update]);

  return { filters, page: Number(filters.pagina), setFilter, setPage };
}
