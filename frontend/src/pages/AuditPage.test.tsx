import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import type { AuditLogEntry } from '@vacations/sdk';
import { queryClient } from '../services/query-client';
import { AuditPage } from './AuditPage';

const { list } = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock('../services/sdk', () => ({ sdk: { auditLog: { list } } }));

const approval: AuditLogEntry = {
  log_id: 1,
  user_id: 2,
  event_type: 'NOTICE_APPROVED',
  entity: 'notice',
  entity_id: '14',
  request_id: 'req-abc',
  http_method: 'POST',
  route: '/api/v1/notices/{noticeId}/approve',
  ip_address: '10.0.0.8',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  metadata: { changes: { remarks: 'Con gusto', skip_saturdays: true } },
  created_at: '2026-11-20T15:30:00.000Z',
  username: 'r.jimenez',
  role_code: 'USER',
  actor_name: 'Rosa Jimenez',
  target_name: 'Juan Perez Lopez',
  result: 'success',
};

const login: AuditLogEntry = {
  ...approval,
  log_id: 2,
  event_type: 'LOGIN_SUCCESS',
  entity: null,
  entity_id: null,
  target_name: null,
  http_method: null,
  route: null,
  metadata: null,
};

const page = { data: [approval, login], pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 } };

const renderPage = (initial = '/auditoria') =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initial]}>
        <AuditPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('AuditPage', () => {
  beforeEach(() => {
    queryClient.clear();
    list.mockReset();
    list.mockResolvedValue(page);
  });

  it('muestra quién, el módulo, la acción y sobre qué', async () => {
    renderPage();

    expect(await screen.findByText('Aprobó una ausencia')).toBeTruthy();
    expect(screen.getAllByText('r.jimenez')).toHaveLength(2);
    expect(screen.getByText('Ausencias')).toBeTruthy();
    expect(screen.getByText('Juan Perez Lopez')).toBeTruthy();
    expect(screen.getByText('Inició sesión')).toBeTruthy();
    expect(screen.getByText('Sesión')).toBeTruthy();
  });

  it('el detalle trae el empleado, el dispositivo, la petición y los datos enviados', async () => {
    renderPage();
    await screen.findByText('Aprobó una ausencia');

    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0]);

    const detail = screen.getByRole('dialog');
    expect(detail.textContent).toContain('Rosa Jimenez');
    expect(detail.textContent).toContain('Juan Perez Lopez (#14)');
    expect(detail.textContent).toContain('Chrome en Windows');
    expect(detail.textContent).toContain('10.0.0.8');
    expect(detail.textContent).toContain('POST /api/v1/notices/{noticeId}/approve');
    expect(detail.textContent).toContain('Comentarios');
    expect(detail.textContent).toContain('Con gusto');
    expect(detail.textContent).toContain('Sin contemplar sábados');
  });

  it('pide solo el módulo elegido', async () => {
    renderPage('/auditoria?modulo=notice');
    await screen.findByText('Aprobó una ausencia');

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ entity: 'notice' }), expect.anything());
  });
});
