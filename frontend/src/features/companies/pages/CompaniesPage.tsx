import { useMemo, useState } from 'react';
import type { CallOptions, Company, Department, Employee, ListEmployeesParams } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { usePagedList } from '../../../lib/use-paged-list';
import { useApiQuery } from '../../../lib/use-api-query';
import { useUrlFilters } from '../../../lib/use-url-filters';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { DataTable, type Column } from '../../../components/DataTable';
import { EmptyState } from '../../../components/EmptyState';

const TABS = [
  { id: 'datos', label: 'Datos de empresa' },
  { id: 'sucursales', label: 'Sucursales' },
  { id: 'empleados', label: 'Empleados' },
];

const FILTERS = { empresa: '', pestana: 'datos' };

const PAGE_SIZE = 10;

const listEmployees = (params: ListEmployeesParams, options: CallOptions) => sdk.employees.list(params, options);

function CompanyData({ company }: { company: Company }) {
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="kv-grid">
        <div className="kv-item">
          <div className="k">Razón social</div>
          <div className="v">{company.company_name}</div>
        </div>
        <div className="kv-item">
          <div className="k">RFC</div>
          <div className="v">{company.rfc ?? '—'}</div>
        </div>
        <div className="kv-item">
          <div className="k">Teléfono</div>
          <div className="v">{company.phone_number ?? '—'}</div>
        </div>
        <div className="kv-item">
          <div className="k">Dirección</div>
          <div className="v">{company.location ?? '—'}</div>
        </div>
      </div>
    </div>
  );
}

function CompanyBranches({ companyId }: { companyId: number }) {
  const branches = useApiQuery(['branches', 'company', companyId], (signal) =>
    sdk.branches.list({ company_id: companyId, status: 'active', pageSize: 100 }, { signal }),
  ).data?.data;

  if (!branches) return <EmptyState message="Cargando..." />;

  return (
    <div className="grid grid-3">
      {branches.map((branch) => (
        <div key={branch.branch_id} className="card">
          <div className="card-head">
            <h3 className="section-title">{branch.branch_name}</h3>
          </div>
          <p className="cell-sub" style={{ marginBottom: 10 }}>
            {branch.code}
          </p>
          <div className="kv-item">
            <div className="k">Empleados</div>
            <div className="v">{branch.active_employees}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompanyEmployees({ companyId, departments }: { companyId: number; departments: Map<number, Department> }) {
  const [page, setPage] = useState(1);
  const params = useMemo(
    () => ({ company_id: companyId, status: 'active' as const, page, pageSize: PAGE_SIZE, sort: 'employee_name' }),
    [companyId, page],
  );
  const { data, loading, error } = usePagedList('employees', listEmployees, params);

  const columns: Column<Employee>[] = [
    { header: 'Nombre', render: (employee) => employee.employee_name, className: 'cell-main' },
    { header: 'Departamento', render: (employee) => departments.get(employee.department_id)?.department_name ?? '' },
    { header: 'Sucursal', render: (employee) => departments.get(employee.department_id)?.branch_name ?? '' },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data?.data ?? []}
      rowKey={(employee) => employee.employee_id}
      loading={loading}
      emptyMessage={error ?? 'No hay empleados en esta empresa.'}
      pagination={{
        page,
        totalPages: data?.pagination.totalPages ?? 1,
        total: data?.pagination.total ?? 0,
        onPageChange: setPage,
      }}
    />
  );
}

export function CompaniesPage() {
  const [filters, setFilters] = useUrlFilters(FILTERS);
  const { data, error } = useApiQuery(['companies', 'active'], (signal) =>
    sdk.companies.list({ status: 'active', pageSize: 100 }, { signal }),
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
      <div className="page-header">
        <div>
          <h1>Empresas</h1>
          <p className="page-sub">Información general y sedes de la organización.</p>
        </div>
      </div>

      {companies && companies.length > 1 && (
        <div className="toolbar">
          <select value={companyId ?? ''} onChange={(e) => setFilters({ empresa: e.target.value })}>
            {companies.map((item) => (
              <option key={item.company_id} value={item.company_id}>
                {item.folio} · {item.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${filters.pestana === tab.id ? 'active' : ''}`}
            onClick={() => setFilters({ pestana: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
