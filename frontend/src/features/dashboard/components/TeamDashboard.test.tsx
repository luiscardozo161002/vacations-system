import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import type { TeamSummary } from '@vacations/sdk';
import { queryClient } from '../../../services/query-client';
import { TeamDashboard } from './TeamDashboard';

const { summary } = vi.hoisted(() => ({ summary: vi.fn() }));

vi.mock('../../../services/sdk', () => ({ sdk: { dashboard: { summary } } }));

const data: TeamSummary = {
  active_employees: 13,
  absent_today: 1,
  pending_requests: 2,
  upcoming_vacations: 3,
  upcoming_absences: [
    {
      notice_id: 1,
      employee_name: 'Juan Perez Lopez',
      department_name: 'Explotacion',
      reason_description: 'Vacaciones',
      absence_start_date: '2026-11-25',
      absence_end_date: '2026-11-25',
      days_taken: 0,
      hours_taken: 3,
    },
  ],
  by_department: [
    { department_id: 1, department_name: 'Explotacion', branch_code: 'THH_HGO', color: '#16a34a', active_employees: 5 },
    { department_id: 2, department_name: 'Administracion', branch_code: 'JOR_HGO', color: null, active_employees: 1 },
  ],
  by_month: [
    { month: '2026-06', absences: 0 },
    { month: '2026-07', absences: 2 },
    { month: '2026-08', absences: 4 },
    { month: '2026-09', absences: 1 },
    { month: '2026-10', absences: 3 },
    { month: '2026-11', absences: 5 },
  ],
  by_reason: [
    { reason_description: 'Vacaciones', absences: 9 },
    { reason_description: 'Permiso Personal', absences: 4 },
    { reason_description: 'Onomástico', absences: 3 },
    { reason_description: 'Deceso', absences: 2 },
    { reason_description: 'Natalicio', absences: 2 },
    { reason_description: 'Castigo', absences: 1 },
    { reason_description: 'Tiempo Por Tiempo', absences: 1 },
  ],
  recent_activity: [],
};

const renderDashboard = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TeamDashboard firstName="Luis" allBranches />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('TeamDashboard', () => {
  beforeEach(() => {
    queryClient.clear();
    summary.mockReset().mockResolvedValue(data);
  });

  it('las ausencias próximas muestran también las horas', async () => {
    renderDashboard();

    expect(await screen.findByText('3 horas')).toBeTruthy();
  });

  it('muestra las ausencias de los últimos seis meses, mes por mes', async () => {
    renderDashboard();
    await screen.findByText('3 horas');

    const chart = screen.getByRole('img', { name: 'Ausencias aprobadas por mes' });
    expect(within(chart).getAllByTitle(/ausencia/)).toHaveLength(6);
    expect(screen.getByTitle('Noviembre: 5 ausencias')).toBeTruthy();
    expect(screen.getByTitle('Junio: 0 ausencias')).toBeTruthy();
  });

  it('agrupa los motivos de menos peso en Otros', async () => {
    renderDashboard();
    await screen.findByText('3 horas');

    expect(screen.getByText('Vacaciones').nextSibling?.textContent).toBe('9');
    expect(screen.getByText('Natalicio')).toBeTruthy();
    expect(screen.getByText('Otros').nextSibling?.textContent).toBe('2');
    expect(screen.queryByText('Castigo')).toBeNull();
    expect(screen.queryByText('Tiempo Por Tiempo')).toBeNull();
  });

  it('las barras de departamento usan el color de su sede', async () => {
    renderDashboard();
    await screen.findByText('3 horas');

    const bars = screen.getAllByRole('progressbar');
    const explotacion = bars.find((bar) => (bar.firstElementChild as HTMLElement).style.background.includes('22, 163, 74'));
    expect(explotacion).toBeTruthy();
  });
});
