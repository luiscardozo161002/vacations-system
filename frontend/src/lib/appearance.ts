export type Theme = 'light' | 'dark';

export const BACKDROP_PRESETS = ['#e7eaee', '#f2f2f0', '#e4ecf3', '#eef1e9', '#efe7f0', '#1c1f24'];
export const BUTTON_COLOR_PRESETS = ['#111111', '#334155', '#1d4ed8', '#0f766e', '#7c3aed', '#9f1239'];

const DEFAULT_BACKDROP = BACKDROP_PRESETS[0];
const DEFAULT_BUTTON_COLOR = BUTTON_COLOR_PRESETS[0];

const KEYS = {
  theme: 'vm_theme',
  backdrop: 'vm_backdrop',
  buttonColor: 'vm_btn_color',
  windowAlpha: 'vm_window_alpha',
};

const readStored = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const root = () => document.documentElement;

const hexToRgb = (hex: string) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const shade = (hex: string, factor: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `#${[r, g, b].map((n) => Math.round(n * factor).toString(16).padStart(2, '0')).join('')}`;
};

const luminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const themeListeners = new Set<() => void>();

export const subscribeTheme = (listener: () => void) => {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
};

export const getTheme = (): Theme => (root().dataset.theme === 'dark' ? 'dark' : 'light');

export const setTheme = (theme: Theme): void => {
  root().dataset.theme = theme;
  writeStored(KEYS.theme, theme);
  themeListeners.forEach((listener) => listener());
};

export const toggleTheme = (): Theme => {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
};

const applyBackdrop = (color: string) => root().style.setProperty('--backdrop', color);

const applyButtonColor = (hex: string) => {
  root().style.setProperty('--btn-primary-bg', hex);
  root().style.setProperty('--btn-primary-bg-hover', shade(hex, 0.85));
  root().style.setProperty('--btn-primary-text', luminance(hex) > 170 ? '#0f172a' : '#ffffff');
};

const applyWindowAlpha = (alpha: number) => root().style.setProperty('--window-bg-alpha', String(alpha));

export const getAppearance = () => ({
  backdrop: readStored(KEYS.backdrop, DEFAULT_BACKDROP),
  buttonColor: readStored(KEYS.buttonColor, DEFAULT_BUTTON_COLOR),
  windowAlpha: Number(readStored(KEYS.windowAlpha, '1')),
});

export const setBackdrop = (color: string): void => {
  applyBackdrop(color);
  writeStored(KEYS.backdrop, color);
};

export const setButtonColor = (hex: string): void => {
  applyButtonColor(hex);
  writeStored(KEYS.buttonColor, hex);
};

export const setWindowAlpha = (alpha: number): void => {
  applyWindowAlpha(alpha);
  writeStored(KEYS.windowAlpha, String(alpha));
};

export const initAppearance = (): void => {
  const { backdrop, buttonColor, windowAlpha } = getAppearance();
  root().dataset.theme = readStored(KEYS.theme, 'light') === 'dark' ? 'dark' : 'light';
  applyBackdrop(backdrop);
  applyButtonColor(buttonColor);
  applyWindowAlpha(windowAlpha);
};
