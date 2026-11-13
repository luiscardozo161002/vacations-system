import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { queryClient } from '../lib/query-client';

afterEach(() => {
  cleanup();
  queryClient.clear();
});
