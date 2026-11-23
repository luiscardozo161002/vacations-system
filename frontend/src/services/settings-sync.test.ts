import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAppearance, getTheme, setButtonColor, setTheme } from '../utils/appearance';
import { startSettingsSync } from './settings-sync';

const { get, save } = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));

vi.mock('./sdk', () => ({ sdk: { settings: { get, save } } }));

const EMPTY = { theme: null, backdrop_light: null, backdrop_dark: null, button_color: null, window_alpha: null };

const flush = async () => {
  await vi.advanceTimersByTimeAsync(0);
};

describe('startSettingsSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    setTheme('light');
    get.mockReset();
    save.mockReset().mockResolvedValue(EMPTY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aplica lo guardado en el servidor al abrir la sesión, sin volver a guardarlo', async () => {
    get.mockResolvedValue({ ...EMPTY, theme: 'dark', button_color: '#7c3aed', window_alpha: 0.9 });

    const stop = startSettingsSync();
    await flush();
    await vi.advanceTimersByTimeAsync(2000);

    expect(getTheme()).toBe('dark');
    expect(getAppearance()).toMatchObject({ buttonColor: '#7c3aed', windowAlpha: 0.9 });
    expect(save).not.toHaveBeenCalled();
    stop();
  });

  it('si el servidor no tiene nada sube lo que hay en este navegador', async () => {
    get.mockResolvedValue(EMPTY);
    setButtonColor('#0f766e');

    const stop = startSettingsSync();
    await flush();

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light', button_color: '#0f766e' }));
    stop();
  });

  it('guarda los cambios con una espera, juntando los seguidos en un solo envío', async () => {
    get.mockResolvedValue({ ...EMPTY, theme: 'light' });
    const stop = startSettingsSync();
    await flush();

    setButtonColor('#1d4ed8');
    setButtonColor('#9f1239');
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(700);

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ button_color: '#9f1239' }));
    stop();
  });

  it('si el servidor falla sigue funcionando con lo local', async () => {
    get.mockRejectedValue(new Error('sin conexión'));

    const stop = startSettingsSync();
    await flush();
    setButtonColor('#1d4ed8');
    await vi.advanceTimersByTimeAsync(700);

    expect(getAppearance().buttonColor).toBe('#1d4ed8');
    stop();
  });
});
