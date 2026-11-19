const env = import.meta.env;

const positive = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  apiBaseUrl: env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  pageSize: positive(env.VITE_PAGE_SIZE, 10),
  catalogPageSize: positive(env.VITE_CATALOG_PAGE_SIZE, 100),
  passwordMinLength: positive(env.VITE_PASSWORD_MIN_LENGTH, 8),
  searchDelayMs: positive(env.VITE_SEARCH_DELAY_MS, 300),
  toastMs: positive(env.VITE_TOAST_MS, 3200),
  staleTimeMs: positive(env.VITE_STALE_TIME_MS, 30000),
  lftReformYear: positive(env.VITE_LFT_REFORM_YEAR, 2023),
  roles: {
    global: env.VITE_ROLE_GLOBAL || 'SUPERUSER',
    scoped: env.VITE_ROLE_SCOPED || 'USER',
    employee: env.VITE_ROLE_EMPLOYEE || 'EMPLOYEE',
  },
};
