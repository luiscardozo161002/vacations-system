import { useMemo, useState } from 'react';
import type { Company, Department, Employee } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { usePagedList } from '../hooks/use-paged-list';
import { useApiQuery } from '../hooks/use-api-query';
import { useUrlFilters } from '../hooks/use-url-filters';
import { useDepartments } from '../features/departments/hooks/useDepartments';
import { ORG_COLORS, branchColor, departmentColor } from '../features/organization/colors';
import { getErrorMessage } from '../utils/get-error-message';
import { formatCode } from '../utils/format';
import { refreshData } from '../services/query-client';
import { useAuth } from '../contexts/auth-context';
import { useToast } from '../hooks/use-toast';
import { ColorBadge } from '../components/atoms/ColorBadge';
import { ColorPopover } from '../components/molecules/ColorPopover';
import { DataTable, type Column } from '../components/organisms/DataTable';
import { Select } from '../components/atoms/Select';
import { EmptyState } from '../components/atoms/EmptyState';
import { PageHeader } from '../components/molecules/PageHeader';
import { KeyValue, KeyValueGrid } from '../components/molecules/KeyValue';
import { Card, CardHeader, CardTitle } from '../components/molecules/Card';
import { Toolbar } from '../components/molecules/Toolbar';
import { Grid } from '../components/molecules/Grid';
import { Tab, TabList, TabPanel, Tabs } from '../components/molecules/Tabs';

const TABS = [
  { id: 'datos', label: 'Datos de empresa' },
  { id: 'sucursales', label: 'Sucursales' },
  { id: 'empleados', label: 'Empleados' },
];

const FILTERS = { empresa: '', pestana: 'datos' };

const saveColor = async (save: Promise<unknown>, showToast: (message: string) => void) => {
  try {
    await save;
    refreshData();
    showToast('Color actualizado.');
  } catch (err) {
    showToast(getErrorMessage(err));
  }
};

function CompanyData({ company, canEdit }: { company: Company; canEdit: boolean }) {
  const showToast = useToast();

  return (
    <Card className="max-w-[520px]" accent={company.color}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {company.company_name}
          <ColorBadge color={company.color}>{company.folio}</ColorBadge>
        </CardTitle>
        {canEdit && (
          <ColorPopover
            label="Color de la empresa"
            value={company.color}
            colors={ORG_COLORS}
            onPick={(color) => saveColor(sdk.companies.update(company.company_id, { color }), showToast)}
          />
        )}
      </CardHeader>
      <KeyValueGrid>
        <KeyValue label="Razón social">{company.company_name}</KeyValue>
        <KeyValue label="RFC">{company.rfc ?? '—'}</KeyValue>
        <KeyValue label="Teléfono">{company.phone_number ?? '—'}</KeyValue>
        <KeyValue label="Dirección">{company.location ?? '—'}</KeyValue>
      </KeyValueGrid>
    </Card>
  );
}

function CompanyBranches({ companyId, canEdit }: { companyId: number; canEdit: boolean }) {
  const showToast = useToast();
  const branches = useApiQuery(['branches', 'company', companyId], (signal) =>
    sdk.branches.list({ company_id: companyId, status: 'active', pageSize: config.catalogPageSize }, { signal }),
  ).data?.data;

  if (!branches) return <EmptyState message="Cargando..." />;

  return (
    <Grid cols={3}>
      {branches.map((branch) => (
        <Card key={branch.branch_id} accent={branchColor(branch)}>
          <CardHeader>
            <CardTitle>{branch.branch_name}</CardTitle>
            {canEdit && (
              <ColorPopover
                label="Color de la sede"
                value={branch.color}
                colors={ORG_COLORS}
                onPick={(color) => saveColor(sdk.branches.update(branch.branch_id, { color }), showToast)}
              />
            )}
          </CardHeader>
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
            <ColorBadge color={branchColor(branch)}>{formatCode(branch.code)}</ColorBadge>
            <ColorBadge color={branch.company_color} title={branch.company_name ?? undefined}>
              {branch.company_folio}
            </ColorBadge>
          </div>
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
    {
      header: 'Sucursal',
      render: (employee) => {
        const department = departments.get(employee.department_id);
        return department?.branch_code ? (
          <ColorBadge color={departmentColor(department)}>{formatCode(department.branch_code)}</ColorBadge>
        ) : null;
      },
    },
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
  const { can } = useAuth();
  const canEdit = can('companies:update');
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
          <Select
            compact
            aria-label="Empresa"
            value={String(companyId ?? '')}
            onChange={(empresa) => setFilters({ empresa })}
            options={companies.map((item) => ({ value: item.company_id, label: `${item.folio} · ${item.company_name}` }))}
          />
        </Toolbar>
      )}

      <Tabs value={filters.pestana} onValueChange={(pestana) => setFilters({ pestana })}>
        <TabList>
          {TABS.map((tab) => (
            <Tab key={tab.id} value={tab.id}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
        {!company ? (
          <EmptyState message={error ?? (companies ? 'No hay empresas.' : 'Cargando...')} />
        ) : (
          <>
            <TabPanel value="datos">
              <CompanyData company={company} canEdit={canEdit} />
            </TabPanel>
            <TabPanel value="sucursales">
              <CompanyBranches companyId={company.company_id} canEdit={canEdit} />
            </TabPanel>
            <TabPanel value="empleados">
              <CompanyEmployees key={company.company_id} companyId={company.company_id} departments={departments} />
            </TabPanel>
          </>
        )}
      </Tabs>
    </>
  );
}
