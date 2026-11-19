import { VacationsSdk } from '@vacations/sdk';
import { config } from './config';
import { browserSessionStorage } from './session-storage';

export const sessionEvents = new EventTarget();

export const sdk = new VacationsSdk({
  baseUrl: config.apiBaseUrl,
  storage: browserSessionStorage,
  onSessionExpired: () => sessionEvents.dispatchEvent(new Event('expired')),
});
