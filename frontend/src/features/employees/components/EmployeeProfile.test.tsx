import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { Employee, VacationEntitlement } from '@vacations/sdk';
import { queryClient } from '../../../services/query-client';
import { EmployeeProfile } from './EmployeeProfile';

const { get, balances, notices } = vi.hoisted(() => ({ get: vi.fn(), balances: vi.fn(), notices: vi.fn() }));

vi.mock('../../../services/sdk', () => ({
  sdk: { employees: { get }, vacationEntitlements: { list: balances }, notices: { list: notices } },
}));
vi.mock('../../../contexts/auth-context', () => ({ useAuth: () => ({ can: () => false }) }));

const employee = {
  employee_id: 3,
  employee_name: 'Carlos Ramirez Soto',
  employee_number: '0003',
  start_date: '2023-01-10',
  status: 'active',
} as Employee;

const entitlement = {
  total_days: 16,
  used_days: 2,
  used_hours: 3,
  daily_hours: 8,
  period_start: '2026-01-10',
  period_end: '2027-01-09',
  available: { days: 13, hours: 5 },
} as VacationEntitlement;

describe('EmployeeProfile', () => {
  beforeEach(() => {
    queryClient.clear();
    get.mockResolvedValue({ account: null });
    balances.mockResolvedValue({ data: [entitlement] });
    notices.mockResolvedValue({ data: [] });
  });

  it('muestra la inicial del nombre como foto de perfil', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EmployeeProfile employee={employee} departmentName="Fletes" shiftName="Operaciones" onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    expect((await screen.findByText('C')).textContent).toBe('C');
  });

  it('el saldo cuenta los días y las horas usadas y las disponibles', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EmployeeProfile employee={employee} departmentName="Fletes" shiftName="Operaciones" onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('2 días y 3 horas')).toBeTruthy();
    expect(screen.getByText('13 días y 5 horas')).toBeTruthy();
  });
});
