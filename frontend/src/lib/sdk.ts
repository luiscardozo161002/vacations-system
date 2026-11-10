import { VacationsSdk } from '@vacations/sdk';
import { browserSessionStorage } from './session-storage';

export const sessionEvents = new EventTarget();

export const sdk = new VacationsSdk({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  storage: browserSessionStorage,
  onSessionExpired: () => sessionEvents.dispatchEvent(new Event('expired')),
});
