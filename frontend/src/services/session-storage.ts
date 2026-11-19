import type { AuthTokens, TokenStorage } from '@vacations/sdk';

const KEY = 'vm_session';

let target: Storage | null = null;

export const rememberSession = (remember: boolean): void => {
  target = remember ? localStorage : sessionStorage;
};

const currentStore = (): Storage => target ?? (sessionStorage.getItem(KEY) ? sessionStorage : localStorage);

export const browserSessionStorage: TokenStorage = {
  get: () => {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  },
  set: (tokens) => {
    const store = currentStore();
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    if (tokens) store.setItem(KEY, JSON.stringify(tokens));
  },
};
