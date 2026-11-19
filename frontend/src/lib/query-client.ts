import { QueryClient } from '@tanstack/react-query';
import { config } from './config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: config.staleTimeMs,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const refreshData = () => queryClient.invalidateQueries();
