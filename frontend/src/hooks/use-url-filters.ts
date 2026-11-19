import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, searchParams.get(key) ?? fallback]),
  ) as T;

  const update = useCallback(
    (changes: Partial<T>) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === defaults[key]) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      ),
    [defaults, setSearchParams],
  );

  return [values, update] as const;
}
