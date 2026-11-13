import { useEffect, useMemo, useState } from 'react';
import type { Employee, EmployeeStatus } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { refreshData } from '../../../lib/query-client';
import { useUrlFilters } from '../../../lib/use-url-filters';
import { formatDate, initials } from '../../../lib/format';
import { Icon } from '../../../components/Icon';
import { DataTable, type Column } from '../../../components/DataTable';
import { ConfirmDialog } from '../../../components/Dialog';
import { SearchSelect } from '../../../components/SearchSelect';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/toast-context';
import { useEmployees } from '../hooks/useEmployees';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { useShifts } from '../../shifts/hooks/useShifts';
import { EmployeeForm } from '../components/EmployeeForm';
import { EmployeeProfile } from '../components/EmployeeProfile';
import { AccessDialog, type GrantedAccess } from '../components/AccessDialog';
import { useAuth } from '../../auth/auth-context';

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 300;
const FILTERS = { q: '', departamento: '', estado: '', pagina: '1', perfil: '' };

export function EmployeesPage() {
  const showToast = useToast();
  const { can } = useAuth();
  const [filters, setFilters] = useUrlFilters(FILTERS);
  const [searchText, setSearchText] = useState(filters.q);
  const page = Number(filters.pagina);

  const { departments, error: departmentsError } = useDepartments();
  const { shifts, error: shiftsError } = useShifts();

  const employeesParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: filters.q || undefined,
      department_id: filters.departamento ? Number(filters.departamento) : undefined,
      status: filters.estado ? (filters.estado as EmployeeStatus) : undefined,
    }),
    [page, filters.q, filters.departamento, filters.estado],
  );

  const { data, loading, error: listError } = useEmployees(employeesParams);

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null);
  const [createdAccess, setCreatedAccess] = useState<GrantedAccess | null>(null);
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (!filters.perfil) return;
    setFilters({ perfil: '' });
    sdk.employees
      .get(Number(filters.perfil))
      .then(setProfileEmployee)
      .catch((err: unknown) => showToast(getErrorMessage(err)));
  }, [filters.perfil, setFilters, showToast]);

  useEffect(() => {
    const search = searchText.trim();
    if (search === filters.q) return;
    const timer = setTimeout(() => setFilters({ q: search, pagina: '1' }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText, filters.q, setFilters]);

  const loadError = listError ?? departmentsError ?? shiftsError;

  const departmentNames = useMemo(
    () => new Map(departments.map((department) => [department.department_id, department.department_name])),
    [departments],
  );

  const shiftNames = useMemo(() => new Map(shifts.map((shift) => [shift.shift_id, shift.shift_name])), [shifts]);

  const departmentOptions = useMemo(
    () => departments.map((department) => ({ value: String(department.department_id), label: department.department_name })),
    [departments],
  );

  const openForm = (employee: Employee | null) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const handleSaved = (message: string, access?: GrantedAccess) => {
    setFormOpen(false);
    showToast(message);
    if (access) setCreatedAccess(access);
    refreshData();
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const willDeactivate = statusTarget.status === 'active';
    setStatusTarget(null);
    try {
      if (willDeactivate) {
        await sdk.employees.remove(statusTarget.employee_id);
      } else {
        await sdk.employees.update(statusTarget.employee_id, { status: 'active' });
      }
      showToast(`${statusTarget.employee_name} ${willDeactivate ? 'dada de baja' : 'reactivada'}.`);
      refreshData();
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  const columns: Column<Employee>[] = [
    {
      header: 'Nombre',
      render: (employee) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">{initials(employee.employee_name)}</div>
          <span className="cell-main">{employee.employee_name}</span>
        </div>
      ),
    },
    { header: 'Número', render: (employee) => employee.employee_number },
    { header: 'Folio', render: (employee) => employee.folio, className: 'cell-sub' },
    { header: 'Departamento', render: (employee) => departmentNames.get(employee.department_id) ?? '' },
    { header: 'Turno', render: (employee) => shiftNames.get(employee.shift_id) ?? '' },
    { header: 'Ingreso', render: (employee) => formatDate(employee.start_date) },
    { header: 'Estado', render: (employee) => <StatusBadge status={employee.status} /> },
    {
      header: '',
      render: (employee) => (
        <div className="row-actions">
          <button type="button" className="icon-btn" title="Ver perfil" onClick={() => setProfileEmployee(employee)}>
            <Icon name="eye" />
          </button>
          {can('employees:update') && (
            <button type="button" className="icon-btn" title="Editar" onClick={() => openForm(employee)}>
              <Icon name="edit" />
            </button>
          )}
          {can('employees:delete') && (
            <button
              type="button"
              className="icon-btn"
              title={employee.status === 'active' ? 'Dar de baja' : 'Reactivar'}
              onClick={() => setStatusTarget(employee)}
            >
              <Icon name={employee.status === 'active' ? 'user-x' : 'user-check'} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Empleados</h1>
          <p className="page-sub">Catálogo de personal, departamentos y turnos.</p>
        </div>
        {can('employees:create') && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => openForm(null)} disabled={departments.length === 0}>
              <Icon name="plus" /> Nuevo empleado
            </button>
          </div>
        )}
      </div>

      <div className="toolbar">
        <div className="search-box" style={{ display: 'flex' }}>
          <Icon name="search" />
          <input
            type="text"
            id="emp-search"
            placeholder="Buscar por nombre o número..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <SearchSelect
          id="emp-dept-filter"
          options={departmentOptions}
          value={filters.departamento}
          onChange={(value) => setFilters({ departamento: value, pagina: '1' })}
          placeholder="Todos los departamentos"
        />
        <select
          value={filters.estado}
          onChange={(e) => setFilters({ estado: e.target.value, pagina: '1' })}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(employee) => employee.employee_id}
        loading={loading}
        emptyMessage={loadError ?? 'No hay empleados con estos filtros.'}
        pagination={{
          page,
          totalPages: data?.pagination.totalPages ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: (next) => setFilters({ pagina: String(next) }),
        }}
      />

      {formOpen && (
        <EmployeeForm
          key={editingEmployee?.employee_id ?? 'new'}
          employee={editingEmployee}
          departments={departments}
          shifts={shifts}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {createdAccess && (
        <AccessDialog
          access={createdAccess}
          onClose={() => setCreatedAccess(null)}
        />
      )}

      {profileEmployee && (
        <EmployeeProfile
          employee={profileEmployee}
          departmentName={departmentNames.get(profileEmployee.department_id) ?? ''}
          shiftName={shiftNames.get(profileEmployee.shift_id) ?? ''}
          onClose={() => setProfileEmployee(null)}
        />
      )}

      {statusTarget && (
        <ConfirmDialog
          title={statusTarget.status === 'active' ? 'Dar de baja empleado' : 'Reactivar empleado'}
          message={
            <>
              ¿Confirmas {statusTarget.status === 'active' ? 'dar de baja a' : 'reactivar a'}{' '}
              <strong>{statusTarget.employee_name}</strong>?
            </>
          }
          onConfirm={confirmStatusChange}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </>
  );
}
