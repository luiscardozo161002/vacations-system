import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderApp } from '../test/render';
import { GlobalSearch } from './GlobalSearch';

const { employeesList } = vi.hoisted(() => ({ employeesList: vi.fn() }));

vi.mock('../lib/sdk', () => ({
  sdk: {
    employees: { list: employeesList },
    departments: {
      list: () => Promise.resolve({ data: [{ department_id: 1, department_name: 'Explotacion' }], pagination: {} }),
    },
  },
}));

const page = (data: object[]) => ({ data, pagination: { page: 1, pageSize: 6, total: data.length, totalPages: 1 } });

describe('Buscador de la topbar', () => {
  beforeEach(() => {
    employeesList.mockReset();
  });

  it('busca mientras se escribe y abre el perfil elegido', async () => {
    employeesList.mockResolvedValue(
      page([{ employee_id: 2, employee_name: 'Maria Garcia Hernandez', employee_number: 'EMP-002', department_id: 1 }]),
    );
    renderApp(<GlobalSearch />, '/dashboard');

    fireEvent.change(screen.getByPlaceholderText(/Buscar empleados/), { target: { value: 'garcia' } });

    const result = await screen.findByText('Maria Garcia Hernandez');
    expect(await screen.findByText('Explotacion · EMP-002')).toBeTruthy();
    expect(employeesList).toHaveBeenCalledWith(
      { search: 'garcia', sort: 'employee_name', pageSize: 6 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    fireEvent.click(result);
    expect(screen.getByTestId('location').textContent).toBe('/empleados?perfil=2');
  });

  it('avisa cuando no hay resultados', async () => {
    employeesList.mockResolvedValue(page([]));
    renderApp(<GlobalSearch />);

    fireEvent.change(screen.getByPlaceholderText(/Buscar empleados/), { target: { value: 'zzz' } });

    expect(await screen.findByText('Sin resultados para "zzz".')).toBeTruthy();
  });
});
