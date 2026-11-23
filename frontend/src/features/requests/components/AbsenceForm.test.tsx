import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { NoticePreview, Reason } from '@vacations/sdk';
import { nextWeekday } from '../../../utils/calendar';
import { todayIso } from '../../../utils/format';
import { AbsenceForm } from './AbsenceForm';

const { preview, create } = vi.hoisted(() => ({ preview: vi.fn(), create: vi.fn() }));

vi.mock('../../../services/sdk', () => ({ sdk: { notices: { preview, create } } }));

const vacation: Reason = {
  reason_id: 1,
  description: 'Vacaciones',
  requires_approval: true,
  affects_vacation_balance: true,
  status: 'active',
};

const withoutBalance: NoticePreview = {
  work_hours: { start: '07:00', end: '15:00' },
  working_weekdays: [1, 2, 3, 4, 5, 6],
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

describe('Solicitud por horas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    preview.mockResolvedValue({ ...withoutBalance, error: null });
  });

  it('por omisión pide el día de hoy, o el siguiente laborable, con el sábado sin habilitar', async () => {
    renderForm();

    await waitFor(() =>
      expect(preview).toHaveBeenLastCalledWith(
        expect.objectContaining({ absence_start_date: nextWeekday(todayIso()), absence_end_date: nextWeekday(todayIso()), skip_saturdays: false }),
        expect.anything(),
      ),
    );
  });

  it('las horas se pueden elegir siempre, también con el rango de varios días', async () => {
    renderForm();
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(1));

    expect((screen.getByRole('checkbox', { name: 'Solo unas horas del día' }) as HTMLButtonElement).hasAttribute('data-disabled')).toBe(false);
  });

  it('con horas pide un solo día y ofrece las horas del turno de ese día', async () => {
    renderForm();
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Solo unas horas del día' }));

    expect(screen.getByLabelText('Día de la ausencia')).toBeTruthy();
    expect(screen.getByText('Horario del turno ese día: 07:00 a 15:00.')).toBeTruthy();
    expect(screen.getByLabelText('Horario de la ausencia').textContent).toContain('07:00 – 08:00');

    fireEvent.click(screen.getByLabelText('Horario de la ausencia'));
    fireEvent.click(screen.getByRole('button', { name: '09:00' }));
    fireEvent.click(screen.getByRole('button', { name: '11:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(screen.getByLabelText('Horario de la ausencia').textContent).toContain('09:00 – 11:00');
    await waitFor(() =>
      expect(preview).toHaveBeenLastCalledWith(
        expect.objectContaining({ absence_start_time: '09:00', absence_end_time: '11:00' }),
        expect.anything(),
      ),
    );
  });
});
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
    const breakdown = screen.getByRole('alert').textContent ?? '';
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
