import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Sidebar } from './Sidebar';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock('../contexts/auth-context', () => ({ useAuth: () => ({ logout, can: () => true }) }));

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <Sidebar
        collapsed={false}
        mobileOpen={false}
        displayName="sysadmin"
        roleLabel="Superusuario"
        onNavigate={vi.fn()}
        onToggleCollapsed={vi.fn()}
        onOpenProfile={vi.fn()}
      />
    </MemoryRouter>,
  );

describe('Sidebar', () => {
  it('muestra el nombre del sistema', () => {
    renderSidebar();

    expect(screen.getByText('Sistema de Vacaciones')).toBeTruthy();
  });

  it('pide confirmar antes de cerrar la sesión', () => {
    logout.mockReset();
    renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(screen.getByText('¿Estás seguro de querer salir del sistema?')).toBeTruthy();
    expect(logout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('si se cierra el aviso no se sale', () => {
    logout.mockReset();
    renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    expect(screen.queryByText('¿Estás seguro de querer salir del sistema?')).toBeNull();
    expect(logout).not.toHaveBeenCalled();
  });
});
