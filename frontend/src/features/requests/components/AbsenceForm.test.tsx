import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { NoticePreview, Reason } from '@vacations/sdk';
import { AbsenceForm } from './AbsenceForm';

const { preview, create } = vi.hoisted(() => ({ preview: vi.fn(), create: vi.fn() }));

vi.mock('../../../lib/sdk', () => ({ sdk: { notices: { preview, create } } }));

const vacation: Reason = {
  reason_id: 1,
  description: 'Vacaciones',
  requires_approval: true,
  affects_vacation_balance: true,
  status: 'active',
};

const withoutBalance: NoticePreview = {
  breakdown: { days: 5, hours: 0, rest_days: 2, holidays: 0, daily_hours: 8 },
  affects_balance: true,
  balance: {
    entitlement_id: 3,
    period_start: '2026-03-01',
    period_end: '2027-02-28',
    total_days: 12,
    available: { days: 2, hours: 0 },
    remaining: { days: -3, hours: 0 },
  },
  error: { code: 'INSUFFICIENT_BALANCE', message: 'No tienes días suficientes' },
};

const renderForm = () => {
  const onSaved = vi.fn();
  render(
    <AbsenceForm
      title="Nueva solicitud"
      submitLabel="Enviar solicitud"
      reasons={[vacation]}
      employee={{ employee_id: 1, employee_name: 'Juan Perez Lopez' }}
      onClose={vi.fn()}
      onSaved={onSaved}
    />,
  );
  return onSaved;
};

describe('Solicitud que excede el saldo', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('muestra el faltante y no deja enviarla', async () => {
    preview.mockResolvedValue(withoutBalance);
    const onSaved = renderForm();

    await waitFor(() => expect(preview).toHaveBeenCalledWith(
      expect.objectContaining({ employee_id: 1, reason_id: 1 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ));
    const submit = screen.getByRole('button', { name: 'Enviar solicitud' }) as HTMLButtonElement;
    await waitFor(() => expect(submit.disabled).toBe(true));
    const breakdown = document.querySelector('.request-breakdown.danger')?.textContent ?? '';
    expect(breakdown).toContain('Esta solicitud excede el saldo disponible.');
    expect(breakdown).toContain('Saldo actual: 2 días');

    fireEvent.submit(submit.closest('form')!);

    expect(create).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(await screen.findByText('No tienes días suficientes')).toBeTruthy();
  });

  it('con saldo suficiente la envía', async () => {
    preview.mockResolvedValue({ ...withoutBalance, error: null });
    create.mockResolvedValue({});
    const onSaved = renderForm();

    const submit = screen.getByRole('button', { name: 'Enviar solicitud' }) as HTMLButtonElement;
    await waitFor(() => expect(preview).toHaveBeenCalled());
    await waitFor(() => expect(submit.disabled).toBe(false));
    fireEvent.click(submit);

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ employee_id: 1, reason_id: 1, remarks: null }));
  });
});
