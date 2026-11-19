import { afterEach, describe, expect, it, vi } from 'vitest';

const loadConfig = async () => {
  vi.resetModules();
  return (await import('./index')).config;
};

afterEach(() => vi.unstubAllEnvs());

describe('config', () => {
  it('usa los valores por defecto cuando no hay variables', async () => {
    vi.stubEnv('VITE_PAGE_SIZE', '');
    vi.stubEnv('VITE_ROLE_GLOBAL', '');

    const config = await loadConfig();

    expect(config.pageSize).toBe(10);
    expect(config.catalogPageSize).toBe(100);
    expect(config.passwordMinLength).toBe(8);
    expect(config.roles).toEqual({ global: 'SUPERUSER', scoped: 'USER', employee: 'EMPLOYEE' });
  });

  it('lee las variables de entorno', async () => {
    vi.stubEnv('VITE_PAGE_SIZE', '25');
    vi.stubEnv('VITE_ROLE_GLOBAL', 'ROOT');
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');

    const config = await loadConfig();

    expect(config.pageSize).toBe(25);
    expect(config.roles.global).toBe('ROOT');
    expect(config.apiBaseUrl).toBe('http://api.test');
  });

  it('acepta una URL vacía para llamar a la API en el mismo origen', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    const config = await loadConfig();

    expect(config.apiBaseUrl).toBe('');
  });

  it('ignora un número inválido', async () => {
    vi.stubEnv('VITE_PAGE_SIZE', '0');
    vi.stubEnv('VITE_TOAST_MS', '3s');

    const config = await loadConfig();

    expect(config.pageSize).toBe(10);
    expect(config.toastMs).toBe(3200);
  });
});
