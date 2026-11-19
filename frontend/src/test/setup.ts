import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { queryClient } from '../api/query-client';

afterEach(() => {
  cleanup();
  queryClient.clear();
});
