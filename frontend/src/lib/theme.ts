export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'vm_theme';

const readStoredTheme = (): Theme | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
};

const storeTheme = (theme: Theme): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
};

const systemTheme = (): Theme => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export const getTheme = (): Theme => (document.documentElement.dataset.theme as Theme | undefined) ?? 'light';

export const initTheme = (): void => {
  document.documentElement.dataset.theme = readStoredTheme() ?? systemTheme();
};

export const setTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme;
  storeTheme(theme);
};

export const toggleTheme = (): Theme => {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
};
