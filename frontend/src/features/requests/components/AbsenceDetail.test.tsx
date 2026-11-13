import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SdkHttpError, type Notice } from '@vacations/sdk';
import { AbsenceDetail } from './AbsenceDetail';
import { ToastProvider } from '../../../components/ToastProvider';
import { queryClient } from '../../../lib/query-client';
import { hrUser } from '../../../test/users';

const { approve, reject, preview } = vi.hoisted(() => ({ approve: vi.fn(), reject: vi.fn(), preview: vi.fn() }));

vi.mock('../../../lib/sdk', () => ({ sdk: { notices: { approve, reject, preview } } }));

const pendingRequest: Notice = {
  notice_id: 7,
  employee_id: 2,
  kind: 'request',
  status: 'pending',
  reason_id: 1,
  absence_start_date: '2027-06-01',
  absence_end_date: '2027-06-02',
  absence_start_time: null,
  absence_end_time: null,
  remarks: null,
  days_taken: 2,
  hours_taken: 0,
  entitlement_id: null,
  created_by: 9,
  approved_by: null,
  approved_at: null,
  request_date: '2026-11-13',
  employee_name: 'Maria Garcia Hernandez',
  employee_number: 'EMP-002',
  department_name: 'Explotacion',
  reason_description: 'Vacaciones',
};

const can = (permission: string) => hrUser.permissions.includes(permission);

const renderDetail = () => {
  const onChanged = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AbsenceDetail notice={pendingRequest} user={hrUser} can={can} onClose={vi.fn()} onChanged={onChanged} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return onChanged;
};

describe('Revisión de una solicitud', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    preview.mockReturnValue(new Promise(() => {}));
  });

  it('RH la aprueba', async () => {
    approve.mockResolvedValue({ ...pendingRequest, status: 'approved' });
    const onChanged = renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(approve).toHaveBeenCalledWith(7);
    expect(screen.getByText('Solicitud de Maria Garcia Hernandez aprobada.')).toBeTruthy();
  });

  it('RH la rechaza después de confirmar', async () => {
    reject.mockResolvedValue({ ...pendingRequest, status: 'rejected' });
    const onChanged = renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
    expect(reject).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog', { name: 'Rechazar solicitud' });
    fireEvent.click(dialog.querySelector('.dialog-foot button')!);

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(reject).toHaveBeenCalledWith(7);
    expect(screen.getByText('Solicitud de Maria Garcia Hernandez rechazada.')).toBeTruthy();
  });

  it('si la API la rechaza, muestra el motivo y no la da por resuelta', async () => {
    approve.mockRejectedValue(
      new SdkHttpError(422, { error: { code: 'INSUFFICIENT_BALANCE', message: 'No tienes días suficientes' } }),
    );
    const onChanged = renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));

    expect(await screen.findByText('No tienes días suficientes')).toBeTruthy();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('sin permiso de revisión no hay botones para aprobar ni rechazar', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AbsenceDetail notice={pendingRequest} user={hrUser} can={() => false} onClose={vi.fn()} onChanged={vi.fn()} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Aprobar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).toBeNull();
  });
});
