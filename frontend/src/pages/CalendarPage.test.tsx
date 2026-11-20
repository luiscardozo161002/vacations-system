import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import type { Calendar } from '@vacations/sdk';
import { queryClient } from '../services/query-client';
import { personHue } from '../utils/calendar';
import { CalendarPage } from './CalendarPage';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('../services/sdk', () => ({ sdk: { calendar: { get } } }));

const absence = (notice_id: number, employee_id: number, employee_name: string, status: 'approved' | 'pending') => ({
  notice_id,
  employee_id,
  employee_name,
  department_name: 'Explotacion',
  reason_description: 'Vacaciones',
  kind: 'request' as const,
  status,
  absence_start_date: '2026-11-03',
  absence_end_date: '2026-11-03',
  absence_start_time: null,
  absence_end_time: null,
  dates: ['2026-11-03'],
});

const calendar: Calendar = {
  from: '2026-11-01',
  to: '2026-11-30',
  holidays: [],
  absences: [absence(1, 1, 'Juan Perez', 'approved'), absence(2, 2, 'Maria Garcia', 'pending')],
};

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/calendario?mes=2026-11']}>
        <CalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('CalendarPage', () => {
  beforeEach(() => {
    queryClient.clear();
    get.mockReset();
    get.mockResolvedValue(calendar);
  });

  it('da a cada persona su propio color', async () => {
    renderPage();

    const juan = (await screen.findByText('Juan')).style.getPropertyValue('--hue');
    const maria = screen.getByText('Maria').style.getPropertyValue('--hue');

    expect(juan).toBe(String(personHue(1)));
    expect(maria).toBe(String(personHue(2)));
    expect(juan).not.toBe(maria);
  });

  it('marca las solicitudes pendientes con borde punteado y lo dice en su título', async () => {
    renderPage();

    const pending = await screen.findByText('Maria');
    const approved = screen.getByText('Juan');

    expect(pending.className).toContain('border-dashed');
    expect(pending.title).toContain('pendiente de aprobación');
    expect(approved.className).not.toContain('border-dashed');
  });

  it('distingue el sábado y el domingo por su fondo', async () => {
    renderPage();
    await screen.findByText('Juan');

    expect(screen.getByText('Sáb').className).toContain('text-warning-fg');
    expect(screen.getByText('Dom').className).toContain('text-danger-fg');
    expect(screen.getByText('Lun').className).not.toContain('text-warning-fg');
  });
});

describe('personHue', () => {
  it('es estable y distinto para empleados distintos', () => {
    const hues = Array.from({ length: 12 }, (_, index) => personHue(index + 1));

    expect(personHue(5)).toBe(personHue(5));
    expect(new Set(hues).size).toBe(hues.length);
  });
});
