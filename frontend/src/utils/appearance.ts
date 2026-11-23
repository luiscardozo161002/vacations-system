import type { UserSettings } from '@vacations/sdk';

export type Theme = 'light' | 'dark';

export const BACKDROP_PRESETS: Record<Theme, string[]> = {
  light: ['#e7eaee', '#f2f2f0', '#e4ecf3', '#eef1e9', '#efe7f0', '#1c1f24'],
  dark: ['#0b1220', '#111827', '#0f1a2b', '#14201c', '#1a1426', '#000000'],
};
export const BUTTON_COLOR_PRESETS = ['#111111', '#334155', '#1d4ed8', '#0f766e', '#7c3aed', '#9f1239'];

const DEFAULT_BUTTON_COLOR = BUTTON_COLOR_PRESETS[0];
const LIGHT_BACKDROP_LUMINANCE = 140;
const MIN_ALPHA_ON_CLASH = 0.85;

const KEYS = {
  theme: 'vm_theme',
  backdrop: { light: 'vm_backdrop', dark: 'vm_backdrop_dark' },
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

const changeListeners = new Set<() => void>();
let importing = false;

export const subscribeAppearance = (listener: () => void) => {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
};

const notifyChange = () => {
  if (!importing) changeListeners.forEach((listener) => listener());
};

export const getTheme = (): Theme => (root().dataset.theme === 'dark' ? 'dark' : 'light');

const backdropFor = (theme: Theme): string => readStored(KEYS.backdrop[theme], BACKDROP_PRESETS[theme][0]);

const clashes = (theme: Theme, backdrop: string): boolean => (theme === 'dark') === (luminance(backdrop) > LIGHT_BACKDROP_LUMINANCE);

const requestedAlpha = (): number => Number(readStored(KEYS.windowAlpha, '1'));

export const effectiveWindowAlpha = (alpha: number, theme: Theme, backdrop: string): number =>
  clashes(theme, backdrop) ? Math.max(alpha, MIN_ALPHA_ON_CLASH) : alpha;

const applyWindow = () => {
  const theme = getTheme();
  const backdrop = backdropFor(theme);
  root().style.setProperty('--backdrop', backdrop);
  root().style.setProperty('--window-bg-alpha', String(effectiveWindowAlpha(requestedAlpha(), theme, backdrop)));
};

export const setTheme = (theme: Theme): void => {
  root().dataset.theme = theme;
  writeStored(KEYS.theme, theme);
  applyWindow();
  themeListeners.forEach((listener) => listener());
  notifyChange();
};

export const toggleTheme = (): Theme => {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
};

const applyButtonColor = (hex: string) => {
  root().style.setProperty('--btn-primary-bg', hex);
  root().style.setProperty('--btn-primary-bg-hover', shade(hex, 0.85));
  root().style.setProperty('--btn-primary-text', luminance(hex) > 170 ? '#0f172a' : '#ffffff');
};

export const getAppearance = () => {
  const theme = getTheme();
  const backdrop = backdropFor(theme);
  const windowAlpha = requestedAlpha();
  return {
    backdrop,
    buttonColor: readStored(KEYS.buttonColor, DEFAULT_BUTTON_COLOR),
    windowAlpha,
    alphaLimited: effectiveWindowAlpha(windowAlpha, theme, backdrop) > windowAlpha,
  };
};

export const setBackdrop = (color: string): void => {
  writeStored(KEYS.backdrop[getTheme()], color);
  applyWindow();
  notifyChange();
};

export const setButtonColor = (hex: string): void => {
  applyButtonColor(hex);
  writeStored(KEYS.buttonColor, hex);
  notifyChange();
};

export const setWindowAlpha = (alpha: number): void => {
  writeStored(KEYS.windowAlpha, String(alpha));
  applyWindow();
  notifyChange();
};

export const exportAppearance = (): UserSettings => ({
  theme: getTheme(),
  backdrop_light: backdropFor('light'),
  backdrop_dark: backdropFor('dark'),
  button_color: readStored(KEYS.buttonColor, DEFAULT_BUTTON_COLOR),
  window_alpha: requestedAlpha(),
});

export const importAppearance = (settings: UserSettings): void => {
  importing = true;
  try {
    if (settings.backdrop_light) writeStored(KEYS.backdrop.light, settings.backdrop_light);
    if (settings.backdrop_dark) writeStored(KEYS.backdrop.dark, settings.backdrop_dark);
    if (settings.button_color) setButtonColor(settings.button_color);
    if (settings.window_alpha !== null) writeStored(KEYS.windowAlpha, String(settings.window_alpha));
    if (settings.theme) setTheme(settings.theme);
    else applyWindow();
  } finally {
    importing = false;
  }
};

export const initAppearance = (): void => {
  root().dataset.theme = readStored(KEYS.theme, 'light') === 'dark' ? 'dark' : 'light';
  applyButtonColor(readStored(KEYS.buttonColor, DEFAULT_BUTTON_COLOR));
  applyWindow();
};
