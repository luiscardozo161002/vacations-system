import { beforeEach, describe, expect, it } from 'vitest';
import {
  BACKDROP_PRESETS,
  effectiveWindowAlpha,
  getAppearance,
  initAppearance,
  setBackdrop,
  setTheme,
  setWindowAlpha,
} from './appearance';

const cssVar = (name: string) => document.documentElement.style.getPropertyValue(name);

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('style');
  initAppearance();
  setTheme('light');
});

describe('apariencia', () => {
  it('cada tema recuerda su propio fondo', () => {
    setBackdrop('#e4ecf3');
    setTheme('dark');

    expect(getAppearance().backdrop).toBe(BACKDROP_PRESETS.dark[0]);
    expect(cssVar('--backdrop')).toBe(BACKDROP_PRESETS.dark[0]);

    setBackdrop('#111827');
    setTheme('light');

    expect(cssVar('--backdrop')).toBe('#e4ecf3');
    expect(getAppearance().backdrop).toBe('#e4ecf3');
  });

  it('respeta la transparencia elegida cuando el fondo combina con el tema', () => {
    setWindowAlpha(0.4);

    expect(cssVar('--window-bg-alpha')).toBe('0.4');
    expect(getAppearance().alphaLimited).toBe(false);

    setTheme('dark');
    expect(cssVar('--window-bg-alpha')).toBe('0.4');
  });

  it('limita la transparencia cuando el fondo contradice el tema', () => {
    setWindowAlpha(0.4);
    setTheme('dark');
    setBackdrop('#f2f2f0');

    expect(cssVar('--window-bg-alpha')).toBe('0.85');
    expect(getAppearance()).toMatchObject({ windowAlpha: 0.4, alphaLimited: true });

    setBackdrop('#0b1220');
    expect(cssVar('--window-bg-alpha')).toBe('0.4');
  });

  it('también limita un fondo oscuro en el tema claro', () => {
    expect(effectiveWindowAlpha(0.4, 'light', '#1c1f24')).toBe(0.85);
    expect(effectiveWindowAlpha(0.9, 'light', '#1c1f24')).toBe(0.9);
    expect(effectiveWindowAlpha(0.4, 'light', '#e7eaee')).toBe(0.4);
  });
});
