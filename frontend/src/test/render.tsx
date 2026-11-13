import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { render } from '@testing-library/react';
import { queryClient } from '../lib/query-client';
import { CurrentLocation } from './CurrentLocation';

export const renderApp = (ui: ReactNode, route = '/') =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                {ui}
                <CurrentLocation />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
