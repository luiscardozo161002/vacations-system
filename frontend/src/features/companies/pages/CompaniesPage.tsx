import { useMemo, useState } from 'react';
import type { Company, Department, Employee } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { config } from '../../../config';
import { usePagedList } from '../../../hooks/use-paged-list';
import { useApiQuery } from '../../../hooks/use-api-query';
import { useUrlFilters } from '../../../hooks/use-url-filters';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { DataTable, type Column } from '../../../components/organisms/DataTable';
import { Select } from '../../../components/atoms/Input';
import { EmptyState } from '../../../components/atoms/EmptyState';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { KeyValue, KeyValueGrid } from '../../../components/molecules/KeyValue';
import { Card, CardHeader, CardTitle } from '../../../components/molecules/Card';
import { Toolbar } from '../../../components/molecules/Toolbar';
import { Grid } from '../../../components/molecules/Grid';
import { Tab, TabList } from '../../../components/molecules/Tabs';

const TABS = [
  { id: 'datos', label: 'Datos de empresa' },
  { id: 'sucursales', label: 'Sucursales' },
  { id: 'empleados', label: 'Empleados' },
];

const FILTERS = { empresa: '', pestana: 'datos' };

function CompanyData({ company }: { company: Company }) {
  return (
    <Card className="max-w-[520px]">
      <KeyValueGrid>
        <KeyValue label="Razón social">{company.company_name}</KeyValue>
        <KeyValue label="RFC">{company.rfc ?? '—'}</KeyValue>
        <KeyValue label="Teléfono">{company.phone_number ?? '—'}</KeyValue>
        <KeyValue label="Dirección">{company.location ?? '—'}</KeyValue>
      </KeyValueGrid>
    </Card>
  );
}

function CompanyBranches({ companyId }: { companyId: number }) {
  const branches = useApiQuery(['branches', 'company', companyId], (signal) =>
    sdk.branches.list({ company_id: companyId, status: 'active', pageSize: config.catalogPageSize }, { signal }),
  ).data?.data;

  if (!branches) return <EmptyState message="Cargando..." />;

  return (
    <Grid cols={3}>
      {branches.map((branch) => (
        <Card key={branch.branch_id}>
          <CardHeader>
            <CardTitle>{branch.branch_name}</CardTitle>
          </CardHeader>
          <p className="mb-2.5 text-[12.5px] text-muted">
            {branch.code}
          </p>
          <KeyValue label="Empleados">{branch.active_employees}</KeyValue>
        </Card>
      ))}
    </Grid>
  );
}

function CompanyEmployees({ companyId, departments }: { companyId: number; departments: Map<number, Department> }) {
  const [page, setPage] = useState(1);
  const params = useMemo(
    () => ({ company_id: companyId, status: 'active' as const, page, pageSize: config.pageSize, sort: 'employee_name' }),
    [companyId, page],
  );
  const { data, loading, error } = usePagedList('employees', sdk.employees, params);

  const columns: Column<Employee>[] = [
    { header: 'Nombre', render: (employee) => employee.employee_name, className: 'font-medium' },
    { header: 'Departamento', render: (employee) => departments.get(employee.department_id)?.department_name ?? '' },
    { header: 'Sucursal', render: (employee) => departments.get(employee.department_id)?.branch_name ?? '' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={(employee) => employee.employee_id}
      page={page}
      onPageChange={setPage}
      loading={loading}
      emptyMessage={error ?? 'No hay empleados en esta empresa.'}
    />
  );
}

export function CompaniesPage() {
  const [filters, setFilters] = useUrlFilters(FILTERS);
  const { data, error } = useApiQuery(['companies', 'active'], (signal) =>
    sdk.companies.list({ status: 'active', pageSize: config.catalogPageSize }, { signal }),
  );
  const { departments: departmentList } = useDepartments();
  const departments = useMemo(
    () => new Map<number, Department>(departmentList.map((department) => [department.department_id, department])),
    [departmentList],
  );

  const companies: Company[] | undefined = data?.data;
  const companyId = filters.empresa ? Number(filters.empresa) : companies?.[0]?.company_id;
  const company = companies?.find((item) => item.company_id === companyId);

  return (
    <>
      <PageHeader title="Empresas" subtitle="Información general y sedes de la organización." />

      {companies && companies.length > 1 && (
        <Toolbar>
          <Select compact aria-label="Empresa" value={companyId ?? ''} onChange={(e) => setFilters({ empresa: e.target.value })}>
            {companies.map((item) => (
              <option key={item.company_id} value={item.company_id}>
                {item.folio} · {item.company_name}
              </option>
            ))}
          </Select>
        </Toolbar>
      )}

      <TabList>
        {TABS.map((tab) => (
          <Tab key={tab.id} active={filters.pestana === tab.id} onClick={() => setFilters({ pestana: tab.id })}>
            {tab.label}
          </Tab>
        ))}
      </TabList>

      {!company ? (
        <EmptyState message={error ?? (companies ? 'No hay empresas.' : 'Cargando...')} />
      ) : filters.pestana === 'datos' ? (
        <CompanyData company={company} />
      ) : filters.pestana === 'sucursales' ? (
        <CompanyBranches companyId={company.company_id} />
      ) : (
        <CompanyEmployees key={company.company_id} companyId={company.company_id} departments={departments} />
      )}
    </>
  );
}
