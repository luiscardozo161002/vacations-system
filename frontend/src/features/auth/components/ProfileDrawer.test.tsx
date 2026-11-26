import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { CurrentUser } from '@vacations/sdk';
import { ProfileDrawer } from './ProfileDrawer';

vi.mock('../../../services/sdk', () => ({ sdk: { auth: { updateMe: vi.fn(), changePassword: vi.fn() } } }));
vi.mock('../../../contexts/auth-context', () => ({ useAuth: () => ({ updateUser: vi.fn() }) }));

const user = { username: 'sysadmin', email: 'sysadmin@grupo-jo.com', employee: null } as unknown as CurrentUser;

const renderDrawer = () => render(<ProfileDrawer user={user} roleLabel="Superusuario" onClose={vi.fn()} />);

describe('ProfileDrawer', () => {
  it('abre en solo lectura con Editar y sin Guardar cambios', () => {
    renderDrawer();

    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeTruthy();
    expect(screen.getByLabelText('Nombre de usuario').matches(':disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull();
    expect(screen.queryByLabelText('Contraseña actual')).toBeNull();
  });

  it('Editar habilita los campos y Guardar cambios solo se activa con algún cambio', () => {
    renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const save = screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement;

    expect(screen.getByRole('heading', { name: 'Editar mi perfil' })).toBeTruthy();
    expect(screen.getByLabelText('Nombre de usuario').matches(':disabled')).toBe(false);
    expect(save.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'sysadmin2' } });
    expect(save.disabled).toBe(false);

    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'sysadmin' } });
    expect(save.disabled).toBe(true);
  });

  it('las contraseñas llevan el ojito para verlas', () => {
    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getAllByRole('button', { name: 'Mostrar contraseña' })).toHaveLength(3);
  });
});
