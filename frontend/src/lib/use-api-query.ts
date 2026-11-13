import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from './get-error-message';

export function useApiQuery<T>(queryKey: readonly unknown[], load: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const query = useQuery({ queryKey, queryFn: ({ signal }) => load(signal), enabled });

  return {
    data: query.data,
    loading: enabled && query.isPending,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
