import { useEffect, useMemo, useState } from 'react';
import type { Branch, CallOptions, Company, Department, Employee, ListEmployeesParams } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { usePagedList } from '../../../lib/use-paged-list';
import { DataTable, type Column } from '../../../components/DataTable';
import { EmptyState } from '../../../components/EmptyState';

const TABS = ['Datos de empresa', 'Sucursales', 'Empleados'] as const;
type Tab = (typeof TABS)[number];

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
  const [branches, setBranches] = useState<Branch[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    sdk.branches
      .list({ company_id: companyId, status: 'active', pageSize: 100 }, { signal: controller.signal })
      .then((result) => setBranches(result.data))
      .catch(() => undefined);
    return () => controller.abort();
  }, [companyId]);

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
  const { data, loading, error } = usePagedList(listEmployees, params);

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
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [departments, setDepartments] = useState<Map<number, Department>>(new Map());
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('Datos de empresa');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([
      sdk.companies.list({ status: 'active', pageSize: 100 }, options),
      sdk.departments.list({ pageSize: 100 }, options),
    ])
      .then(([companyPage, departmentPage]) => {
        setCompanies(companyPage.data);
        setCompanyId(companyPage.data[0]?.company_id ?? null);
        setDepartments(new Map(departmentPage.data.map((department) => [department.department_id, department])));
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, []);

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
          <select value={companyId ?? ''} onChange={(e) => setCompanyId(Number(e.target.value))}>
            {companies.map((item) => (
              <option key={item.company_id} value={item.company_id}>
                {item.folio} · {item.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="tabs">
        {TABS.map((name) => (
          <button key={name} type="button" className={`tab ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </div>

      {!company ? (
        <EmptyState message={error ?? (companies ? 'No hay empresas.' : 'Cargando...')} />
      ) : tab === 'Datos de empresa' ? (
        <CompanyData company={company} />
      ) : tab === 'Sucursales' ? (
        <CompanyBranches companyId={company.company_id} />
      ) : (
        <CompanyEmployees key={company.company_id} companyId={company.company_id} departments={departments} />
      )}
    </>
  );
}
