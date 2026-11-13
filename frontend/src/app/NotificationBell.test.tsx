import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderApp } from '../test/render';
import { NotificationBell } from './NotificationBell';

const { list, markAllRead } = vi.hoisted(() => ({ list: vi.fn(), markAllRead: vi.fn() }));

vi.mock('../lib/sdk', () => ({ sdk: { notifications: { list, markAllRead } } }));

const pendingRequest = {
  notice_id: 7,
  kind: 'request',
  employee_name: 'Maria Garcia Hernandez',
  days_taken: 0,
  hours_taken: 2,
  reason_description: 'Vacaciones',
};

const resolution = {
  notification_id: 1,
  kind: 'request_approved',
  title: 'Tu solicitud fue aprobada',
  body: 'Vacaciones, el 02/06/2027.',
  link: '/solicitudes',
  read_at: null,
  created_at: '2026-11-13T10:00:00Z',
};

describe('Campana de notificaciones', () => {
  beforeEach(() => {
    list.mockReset();
    markAllRead.mockReset();
  });

  it('muestra los pendientes del aprobador y lleva a su pantalla', async () => {
    list.mockResolvedValue({ data: [], unread: 0, pending: { total: 1, data: [pendingRequest] } });
    const { container } = renderApp(<NotificationBell />, '/dashboard');

    await waitFor(() => expect(container.querySelector('#notif-badge')?.hasAttribute('hidden')).toBe(false));
    fireEvent.click(screen.getByTitle('Notificaciones'));

    expect(screen.getByText('Notificaciones (1)')).toBeTruthy();
    fireEvent.click(screen.getByText('Solicitud de Maria Garcia Hernandez'));
    expect(screen.getByTestId('location').textContent).toBe('/solicitudes');
    expect(markAllRead).not.toHaveBeenCalled();
  });

  it('marca como leídas las resoluciones al abrirla', async () => {
    list.mockResolvedValue({ data: [resolution], unread: 1, pending: { total: 0, data: [] } });
    markAllRead.mockResolvedValue({ data: [], unread: 0, pending: { total: 0, data: [] } });
    const { container } = renderApp(<NotificationBell />);

    await waitFor(() => expect(container.querySelector('#notif-badge')?.hasAttribute('hidden')).toBe(false));
    fireEvent.click(screen.getByTitle('Notificaciones'));

    expect(await screen.findByText('Tu solicitud fue aprobada')).toBeTruthy();
    await waitFor(() => expect(markAllRead).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.querySelector('#notif-badge')?.hasAttribute('hidden')).toBe(true));
  });
});
