import { useMemo, useState } from 'react';
import type { Branch, Company, Department, Employee } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { usePagedList } from '../hooks/use-paged-list';
import { useApiQuery } from '../hooks/use-api-query';
import { useUrlFilters } from '../hooks/use-url-filters';
import { useRecordForm } from '../hooks/use-record-form';
import { useDepartments } from '../features/departments/hooks/useDepartments';
import { CompanyForm } from '../features/companies/components/CompanyForm';
import { BranchForm } from '../features/companies/components/BranchForm';
import { ORG_COLORS, branchColor, departmentColor } from '../features/organization/colors';
import { getErrorMessage } from '../utils/get-error-message';
import { formatCode } from '../utils/format';
import { refreshData } from '../services/query-client';
import { useAuth } from '../contexts/auth-context';
import { useToast } from '../hooks/use-toast';
import { ColorBadge } from '../components/atoms/ColorBadge';
import { Button } from '../components/atoms/Button';
import { Icon } from '../components/atoms/Icon';
import { IconButton } from '../components/atoms/IconButton';
import { ColorPopover } from '../components/molecules/ColorPopover';
import { DataTable, type Column } from '../components/organisms/DataTable';
import { ConfirmDialog } from '../components/organisms/Dialog';
import { Select } from '../components/atoms/Select';
import { EmptyState } from '../components/atoms/EmptyState';
import { StatusBadge } from '../components/atoms/StatusBadge';
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

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Dadas de baja' },
];

const FILTERS = { empresa: '', pestana: 'datos', estado: 'active' };

type RecordStatus = 'active' | 'inactive';

interface StatusChange {
  kind: 'company' | 'branch';
  id: number;
  name: string;
  activate: boolean;
}

const saveColor = async (save: Promise<unknown>, showToast: (message: string) => void) => {
  try {
    await save;
    refreshData();
    showToast('Color actualizado.');
  } catch (err) {
    showToast(getErrorMessage(err));
  }
};

interface CompanyDataProps {
  company: Company;
  canEdit: boolean;
  canManage: boolean;
  onEdit: () => void;
  onChangeStatus: () => void;
}

function CompanyData({ company, canEdit, canManage, onEdit, onChangeStatus }: CompanyDataProps) {
  const showToast = useToast();
  const active = company.status === 'active';

  return (
    <Card className="max-w-[520px]" accent={company.color}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {company.company_name}
          <ColorBadge color={company.color}>{company.folio}</ColorBadge>
          {!active && <StatusBadge status="inactive" />}
        </CardTitle>
        <div className="flex gap-1.5">
          {canEdit && (
            <ColorPopover
              label="Color de la empresa"
              value={company.color}
              colors={ORG_COLORS}
              onPick={(color) => saveColor(sdk.companies.update(company.company_id, { color }), showToast)}
            />
          )}
          {canManage && (
            <>
              <IconButton title="Editar empresa" onClick={onEdit}>
                <Icon name="edit" />
              </IconButton>
              <IconButton title={active ? 'Dar de baja la empresa' : 'Reactivar la empresa'} onClick={onChangeStatus}>
                <Icon name={active ? 'user-x' : 'user-check'} />
              </IconButton>
            </>
          )}
        </div>
      </CardHeader>
      {company.logo && <img src={company.logo} alt={`Logotipo de ${company.company_name}`} className="mb-3.5 h-14 max-w-full object-contain" />}
      <KeyValueGrid>
        <KeyValue label="Razón social">{company.company_name}</KeyValue>
        <KeyValue label="RFC">{company.rfc ?? '—'}</KeyValue>
        <KeyValue label="Teléfono">{company.phone_number ?? '—'}</KeyValue>
        <KeyValue label="Dirección">{company.location ?? '—'}</KeyValue>
      </KeyValueGrid>
    </Card>
  );
}

interface CompanyBranchesProps {
  companyId: number;
  status: RecordStatus;
  canEdit: boolean;
  canManage: boolean;
  onCreate: () => void;
  onEdit: (branch: Branch) => void;
  onChangeStatus: (branch: Branch) => void;
}

function CompanyBranches({ companyId, status, canEdit, canManage, onCreate, onEdit, onChangeStatus }: CompanyBranchesProps) {
  const showToast = useToast();
  const branches = useApiQuery(['branches', 'company', companyId, status], (signal) =>
    sdk.branches.list({ company_id: companyId, status, pageSize: config.catalogPageSize }, { signal }),
  ).data?.data;

  if (!branches) return <EmptyState message="Cargando..." />;

  return (
    <>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={onCreate}>
            <Icon name="plus" /> Nueva sede
          </Button>
        </div>
      )}
      {branches.length === 0 && <EmptyState message="Esta empresa no tiene sedes con ese estado." />}
      <Grid cols={3}>
        {branches.map((branch) => (
          <Card key={branch.branch_id} accent={branchColor(branch)}>
            <CardHeader>
              <CardTitle>{branch.branch_name}</CardTitle>
              <div className="flex gap-1.5">
                {canEdit && (
                  <ColorPopover
                    label="Color de la sede"
                    value={branch.color}
                    colors={ORG_COLORS}
                    onPick={(color) => saveColor(sdk.branches.update(branch.branch_id, { color }), showToast)}
                  />
                )}
                {canManage && (
                  <>
                    <IconButton title="Editar sede" onClick={() => onEdit(branch)}>
                      <Icon name="edit" />
                    </IconButton>
                    <IconButton
                      title={branch.status === 'active' ? 'Dar de baja la sede' : 'Reactivar la sede'}
                      onClick={() => onChangeStatus(branch)}
                    >
                      <Icon name={branch.status === 'active' ? 'user-x' : 'user-check'} />
                    </IconButton>
                  </>
                )}
              </div>
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
    </>
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
  const showToast = useToast();
  const canEdit = can('companies:update');
  const canManage = can('companies:create');
  const [filters, setFilters] = useUrlFilters(FILTERS);
  const status = filters.estado === 'inactive' ? 'inactive' : 'active';
  const companyForm = useRecordForm<Company>();
  const branchForm = useRecordForm<Branch>();
  const [statusChange, setStatusChange] = useState<StatusChange | null>(null);

  const { data, error } = useApiQuery(['companies', status], (signal) =>
    sdk.companies.list({ status, pageSize: config.catalogPageSize }, { signal }),
  );
  const activeCompanies = useApiQuery(['companies', 'active'], (signal) =>
    sdk.companies.list({ status: 'active', pageSize: config.catalogPageSize }, { signal }),
  ).data?.data;
  const { departments: departmentList } = useDepartments();
  const departments = useMemo(
    () => new Map<number, Department>(departmentList.map((department) => [department.department_id, department])),
    [departmentList],
  );

  const companies: Company[] | undefined = data?.data;
  const companyId = filters.empresa ? Number(filters.empresa) : companies?.[0]?.company_id;
  const company = companies?.find((item) => item.company_id === companyId);

  const confirmStatusChange = async () => {
    if (!statusChange) return;
    const { kind, id, name, activate } = statusChange;
    setStatusChange(null);
    try {
      if (kind === 'company') {
        if (activate) await sdk.companies.update(id, { status: 'active' });
        else await sdk.companies.remove(id);
      } else if (activate) {
        await sdk.branches.update(id, { status: 'active' });
      } else {
        await sdk.branches.remove(id);
      }
      showToast(`${name} ${activate ? 'reactivada' : 'dada de baja'}.`);
      refreshData();
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  const changeCompanyStatus = () => {
    if (company) setStatusChange({ kind: 'company', id: company.company_id, name: company.company_name, activate: company.status !== 'active' });
  };

  const changeBranchStatus = (branch: Branch) =>
    setStatusChange({ kind: 'branch', id: branch.branch_id, name: branch.branch_name, activate: branch.status !== 'active' });

  return (
    <>
      <PageHeader title="Empresas" subtitle="Información general y sedes de la organización.">
        {canManage && (
          <Button onClick={() => companyForm.open()}>
            <Icon name="plus" /> Nueva empresa
          </Button>
        )}
      </PageHeader>

      <Toolbar>
        {companies && companies.length > 1 && (
          <Select
            compact
            aria-label="Empresa"
            value={String(companyId ?? '')}
            onChange={(empresa) => setFilters({ empresa })}
            options={companies.map((item) => ({ value: item.company_id, label: `${item.folio} · ${item.company_name}` }))}
          />
        )}
        {canManage && (
          <Select
            compact
            aria-label="Estado"
            value={status}
            onChange={(estado) => setFilters({ estado, empresa: '' })}
            options={STATUS_OPTIONS}
          />
        )}
      </Toolbar>

      <Tabs value={filters.pestana} onValueChange={(pestana) => setFilters({ pestana })}>
        <TabList>
          {TABS.map((tab) => (
            <Tab key={tab.id} value={tab.id}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
        {!company ? (
          <EmptyState message={error ?? (companies ? (status === 'active' ? 'No hay empresas.' : 'No hay empresas dadas de baja.') : 'Cargando...')} />
        ) : (
          <>
            <TabPanel value="datos">
              <CompanyData
                company={company}
                canEdit={canEdit}
                canManage={canManage}
                onEdit={() => companyForm.open(company)}
                onChangeStatus={changeCompanyStatus}
              />
            </TabPanel>
            <TabPanel value="sucursales">
              <CompanyBranches
                companyId={company.company_id}
                status={status}
                canEdit={canEdit}
                canManage={canManage && company.status === 'active'}
                onCreate={() => branchForm.open()}
                onEdit={(branch) => branchForm.open(branch)}
                onChangeStatus={changeBranchStatus}
              />
            </TabPanel>
            <TabPanel value="empleados">
              <CompanyEmployees key={company.company_id} companyId={company.company_id} departments={departments} />
            </TabPanel>
          </>
        )}
      </Tabs>

      {companyForm.isOpen && (
        <CompanyForm
          key={companyForm.record?.company_id ?? 'new'}
          company={companyForm.record}
          onClose={companyForm.close}
          onSaved={(message, saved) => {
            companyForm.saved(message);
            setFilters({ empresa: String(saved.company_id), estado: saved.status });
          }}
        />
      )}

      {branchForm.isOpen && company && (
        <BranchForm
          key={branchForm.record?.branch_id ?? 'new'}
          branch={branchForm.record}
          companies={activeCompanies ?? []}
          defaultCompanyId={company.company_id}
          onClose={branchForm.close}
          onSaved={branchForm.saved}
        />
      )}

      {statusChange && (
        <ConfirmDialog
          title={statusChange.activate ? 'Reactivar' : 'Dar de baja'}
          message={
            <>
              ¿{statusChange.activate ? 'Reactivar' : 'Dar de baja'} {statusChange.kind === 'company' ? 'la empresa' : 'la sede'}{' '}
              <strong>{statusChange.name}</strong>?
              {!statusChange.activate &&
                (statusChange.kind === 'company'
                  ? ' Antes debes dar de baja sus sedes.'
                  : ' Antes debes dar de baja sus departamentos.')}
            </>
          }
          confirmLabel={statusChange.activate ? 'Reactivar' : 'Dar de baja'}
          onConfirm={confirmStatusChange}
          onCancel={() => setStatusChange(null)}
        />
      )}
    </>
  );
}
