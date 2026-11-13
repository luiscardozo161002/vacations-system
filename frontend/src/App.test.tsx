import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SdkHttpError } from '@vacations/sdk';
import App from './App';
import { AuthProvider } from './features/auth/AuthProvider';
import { queryClient } from './lib/query-client';
import { employeeUser, hrUser } from './test/users';

const { auth, sessionEvents } = vi.hoisted(() => ({
  auth: { isAuthenticated: vi.fn(), login: vi.fn(), me: vi.fn(), logout: vi.fn() },
  sessionEvents: new EventTarget(),
}));

vi.mock('./lib/sdk', async () => {
  const { sdkMock } = await import('./test/sdk-mock');
  return { sdk: sdkMock({ auth }), sessionEvents };
});

const renderApp = (path = '/') => {
  window.history.pushState({}, '', path);
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>,
  );
};

const menu = () => [...document.querySelectorAll('.sidebar .nav-item')].map((item) => item.textContent?.trim());

const signIn = () => {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'j.perez@jo.com.mx' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Secreta2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
};

describe('Inicio de sesión', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.isAuthenticated.mockReturnValue(false);
    auth.logout.mockResolvedValue(undefined);
  });

  it('entra con correo y contraseña y muestra el menú del Empleado', async () => {
    auth.login.mockResolvedValue({});
    auth.me.mockResolvedValue(employeeUser);
    renderApp();

    signIn();

    await waitFor(() => expect(menu()).toEqual(['Dashboard', 'Solicitudes', 'Calendario', 'Días', 'Avisos', 'Configuración']));
    expect(auth.login).toHaveBeenCalledWith({ email: 'j.perez@jo.com.mx', password: 'Secreta2026' });
  });

  it('explica en español por qué no pudo entrar', async () => {
    auth.login.mockRejectedValueOnce(
      new SdkHttpError(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Usuario o contraseña incorrectos' } }),
    );
    auth.login.mockRejectedValueOnce(new SdkHttpError(423, { error: { code: 'ACCOUNT_LOCKED', message: 'Bloqueada' } }));
    renderApp();

    signIn();
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeTruthy();

    signIn();
    expect(await screen.findByText(/Tu cuenta está bloqueada por demasiados intentos fallidos/)).toBeTruthy();
    expect(auth.me).not.toHaveBeenCalled();
  });
});

describe('Sesión expirada', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.isAuthenticated.mockReturnValue(true);
  });

  it('regresa al login con el aviso y vacía la caché', async () => {
    auth.me.mockResolvedValue(hrUser);
    renderApp('/dashboard');
    await waitFor(() => expect(menu()).toContain('Dashboard'));
    queryClient.setQueryData(['employees', 'active'], []);

    sessionEvents.dispatchEvent(new Event('expired'));

    expect(await screen.findByText('Tu sesión expiró. Vuelve a iniciar sesión.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

describe('Menú según el rol', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.isAuthenticated.mockReturnValue(true);
  });

  it('RH ve la gestión y la organización, pero no la administración', async () => {
    auth.me.mockResolvedValue(hrUser);
    renderApp('/dashboard');

    await waitFor(() =>
      expect(menu()).toEqual([
        'Dashboard',
        'Empleados',
        'Solicitudes',
        'Calendario',
        'Días',
        'Avisos',
        'Departamentos',
        'Empresas',
        'Turnos y horarios',
        'Reglas de acumulación',
        'Configuración',
      ]),
    );
  });

  it('una URL sin permiso lleva al primer módulo permitido', async () => {
    auth.me.mockResolvedValue(employeeUser);
    renderApp('/usuarios');

    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));
    expect(menu()).not.toContain('Usuarios');
  });
});
