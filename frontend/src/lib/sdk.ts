import { VacationsSdk } from '@vacations/sdk';

export const sdk = new VacationsSdk({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});
