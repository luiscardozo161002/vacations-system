import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../services/query-client';
import { ORG_FILTERS, orgParams, type OrgFilterValues } from '../org-filters';
import { OrgFilters } from './OrgFilters';

const { companies, branches, departments } = vi.hoisted(() => ({ companies: vi.fn(), branches: vi.fn(), departments: vi.fn() }));

vi.mock('../../../services/sdk', () => ({
  sdk: { companies: { list: companies }, branches: { list: branches }, departments: { list: departments } },
}));

const page = (data: unknown[]) => ({ data, pagination: { page: 1, pageSize: 100, total: data.length, totalPages: 1 } });

describe('OrgFilters', () => {
  beforeEach(() => {
    queryClient.clear();
    companies.mockResolvedValue(
      page([
        { company_id: 1, company_name: 'Jorsa', color: '#2563eb' },
        { company_id: 2, company_name: 'Transportes', color: '#16a34a' },
      ]),
    );
    branches.mockResolvedValue(
      page([
        { branch_id: 3, company_id: 1, code: 'JOR_HGO', branch_name: 'Hidalgo', color: null, company_color: '#2563eb' },
        { branch_id: 5, company_id: 2, code: 'THH_HGO', branch_name: 'Hidalgo', color: null, company_color: '#16a34a' },
      ]),
    );
    departments.mockResolvedValue(
      page([
        { department_id: 3, branch_id: 3, branch_code: 'JOR_HGO', department_name: 'Administracion', branch_color: null, company_color: '#2563eb' },
        { department_id: 8, branch_id: 5, branch_code: 'THH_HGO', department_name: 'Administracion', branch_color: null, company_color: '#16a34a' },
      ]),
    );
  });

  const renderFilters = (values: Partial<OrgFilterValues> = {}) => {
    const setFilter = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <OrgFilters idPrefix="t" filters={{ ...ORG_FILTERS, ...values }} setFilter={setFilter} />
      </QueryClientProvider>,
    );
    return setFilter;
  };

  const open = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Empresa, sede y departamento' }));
    await screen.findByRole('button', { name: 'Expandir Transportes' });
  };

  it('muestra las empresas y al expandir una, sus sedes, y al expandir la sede, sus departamentos', async () => {
    renderFilters();
    await open();

    expect(screen.queryByText('THH HGO · Hidalgo')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Transportes' }));
    expect(screen.getByText('THH HGO · Hidalgo')).toBeTruthy();
    expect(screen.queryByText('JOR HGO · Hidalgo')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Expandir THH HGO · Hidalgo' }));
    expect(screen.getByText('Administracion')).toBeTruthy();
  });

  it('elegir una empresa, una sede o un departamento fija todo el camino', async () => {
    const setFilter = renderFilters();
    await open();

    fireEvent.click(screen.getByRole('button', { name: 'Transportes' }));
    expect(setFilter).toHaveBeenLastCalledWith({ empresa: '2', sede: '', departamento: '' });

    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Transportes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Expandir THH HGO · Hidalgo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Administracion' }));
    expect(setFilter).toHaveBeenLastCalledWith({ empresa: '2', sede: '5', departamento: '8' });
  });

  it('el botón dice lo elegido, sin guion bajo, y «Todas las empresas» lo limpia', async () => {
    const setFilter = renderFilters({ empresa: '2', sede: '5' });

    const trigger = await screen.findByRole('button', { name: 'Empresa, sede y departamento' });
    await waitFor(() => expect(trigger.textContent).toContain('THH HGO · Hidalgo'));

    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: 'Todas las empresas' }));

    expect(setFilter).toHaveBeenCalledWith({ empresa: '', sede: '', departamento: '' });
  });

  it('al abrir ya viene expandido el camino de lo elegido', async () => {
    renderFilters({ empresa: '2', sede: '5', departamento: '8' });

    fireEvent.click(await screen.findByRole('button', { name: 'Empresa, sede y departamento' }));

    expect(await screen.findByText('THH HGO · Hidalgo')).toBeTruthy();
    expect(screen.getAllByText('Administracion').length).toBeGreaterThan(0);
  });
});

describe('orgParams', () => {
  it('manda solo lo que se eligió, como número', () => {
    expect(orgParams({ empresa: '2', sede: '', departamento: '8' })).toEqual({
      company_id: 2,
      branch_id: undefined,
      department_id: 8,
    });
  });
});
