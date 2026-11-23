import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../services/query-client';
import { ORG_FILTERS, orgParams } from '../org-filters';
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
        { company_id: 1, company_name: 'Jorsa' },
        { company_id: 2, company_name: 'Transportes' },
      ]),
    );
    branches.mockResolvedValue(
      page([
        { branch_id: 3, company_id: 1, code: 'JOR_HGO', branch_name: 'Hidalgo' },
        { branch_id: 5, company_id: 2, code: 'THH_HGO', branch_name: 'Hidalgo' },
      ]),
    );
    departments.mockResolvedValue(
      page([
        { department_id: 3, branch_id: 3, branch_code: 'JOR_HGO', department_name: 'Administracion' },
        { department_id: 8, branch_id: 5, branch_code: 'THH_HGO', department_name: 'Administracion' },
      ]),
    );
  });

  const renderFilters = (empresa = '', sede = '') => {
    const setFilter = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <OrgFilters idPrefix="t" filters={{ ...ORG_FILTERS, empresa, sede }} setFilter={setFilter} />
      </QueryClientProvider>,
    );
    return setFilter;
  };

  const open = (placeholder: string) => fireEvent.focus(screen.getByRole('combobox', { name: placeholder }));

  it('al elegir una empresa limpia la sede y el departamento', async () => {
    const setFilter = renderFilters();
    await screen.findByRole('combobox', { name: 'Todas las empresas' });
    open('Todas las empresas');

    fireEvent.click(await screen.findByRole('option', { name: 'Transportes' }));

    expect(setFilter).toHaveBeenCalledWith({ empresa: '2', sede: '', departamento: '' });
  });

  it('las sedes se limitan a la empresa elegida y no tienen guion bajo', async () => {
    renderFilters('2');
    await screen.findByRole('combobox', { name: 'Todas las sedes' });
    open('Todas las sedes');

    expect(await screen.findByRole('option', { name: 'THH HGO · Hidalgo' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'JOR HGO · Hidalgo' })).toBeNull();
  });

  it('los departamentos repetidos se distinguen por la sede', async () => {
    renderFilters();
    await screen.findByRole('combobox', { name: 'Todos los departamentos' });
    open('Todos los departamentos');

    expect(await screen.findByRole('option', { name: 'Administracion · JOR HGO' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Administracion · THH HGO' })).toBeTruthy();
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
