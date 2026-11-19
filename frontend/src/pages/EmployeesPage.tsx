import { useEffect, useMemo, useState } from 'react';
import type { Employee, RecordStatus } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { getErrorMessage } from '../utils/get-error-message';
import { refreshData } from '../services/query-client';
import { usePageFilters } from '../hooks/use-page-filters';
import { usePagedList } from '../hooks/use-paged-list';
import { useRecordForm } from '../hooks/use-record-form';
import { formatDate, initials, todayIso } from '../utils/format';
import { saveFile } from '../utils/save-file';
import { Icon } from '../components/atoms/Icon';
import { DataTable, type Column } from '../components/organisms/DataTable';
import { Select } from '../components/atoms/Select';
import { ConfirmDialog } from '../components/organisms/Dialog';
import { PageHeader } from '../components/molecules/PageHeader';
import { SearchSelect } from '../components/molecules/SearchSelect';
import { SearchInput } from '../components/molecules/SearchInput';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { useToast } from '../hooks/use-toast';
import { useDepartments } from '../features/departments/hooks/useDepartments';
import { useShifts } from '../features/shifts/hooks/useShifts';
import { EmployeeForm } from '../features/employees/components/EmployeeForm';
import { EmployeeProfile } from '../features/employees/components/EmployeeProfile';
import { AccessDialog, type GrantedAccess } from '../features/employees/components/AccessDialog';
import { useAuth } from '../contexts/auth-context';
import { IconButton } from '../components/atoms/IconButton';
import { Button } from '../components/atoms/Button';
import { Avatar } from '../components/atoms/Avatar';
import { RowActions, Toolbar, ToolbarSpacer } from '../components/molecules/Toolbar';

const FILTERS = { q: '', departamento: '', estado: '', perfil: '' };

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

export function EmployeesPage() {
  const showToast = useToast();
  const { can } = useAuth();
  const { filters, page, setFilter, setPage } = usePageFilters(FILTERS);
  const form = useRecordForm<Employee>();

  const { departments, error: departmentsError } = useDepartments();
  const { shifts, error: shiftsError } = useShifts();

  const employeesParams = useMemo(
    () => ({
      page,
      pageSize: config.pageSize,
      search: filters.q || undefined,
      department_id: filters.departamento ? Number(filters.departamento) : undefined,
      status: filters.estado ? (filters.estado as RecordStatus) : undefined,
    }),
    [page, filters.q, filters.departamento, filters.estado],
  );

  const { data, loading, error: listError } = usePagedList('employees', sdk.employees, employeesParams);

  const [statusTarget, setStatusTarget] = useState<Employee | null>(null);
  const [createdAccess, setCreatedAccess] = useState<GrantedAccess | null>(null);
  const [exporting, setExporting] = useState(false);
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (!filters.perfil) return;
    setFilter({ perfil: '' });
    sdk.employees
      .get(Number(filters.perfil))
      .then(setProfileEmployee)
      .catch((err: unknown) => showToast(getErrorMessage(err)));
  }, [filters.perfil, setFilter, showToast]);

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

  const handleSaved = (message: string, access?: GrantedAccess) => {
    form.saved(message);
    if (access) setCreatedAccess(access);
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

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { search, department_id, status } = employeesParams;
      saveFile(await sdk.employees.exportCsv({ search, department_id, status }), `empleados-${todayIso()}.csv`);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<Employee>[] = [
    {
      header: 'Nombre',
      render: (employee) => (
        <div className="flex items-center gap-2.5">
          <Avatar>{initials(employee.employee_name)}</Avatar>
          <span className="font-medium">{employee.employee_name}</span>
        </div>
      ),
    },
    { header: 'Número', render: (employee) => employee.employee_number },
    { header: 'Folio', render: (employee) => employee.folio, className: 'text-[12.5px] text-muted' },
    { header: 'Departamento', render: (employee) => departmentNames.get(employee.department_id) ?? '' },
    { header: 'Turno', render: (employee) => shiftNames.get(employee.shift_id) ?? '' },
    { header: 'Ingreso', render: (employee) => formatDate(employee.start_date) },
    { header: 'Estado', render: (employee) => <StatusBadge status={employee.status} /> },
    {
      header: '',
      render: (employee) => (
        <RowActions>
          <IconButton title="Ver perfil" onClick={() => setProfileEmployee(employee)}>
            <Icon name="eye" />
          </IconButton>
          {can('employees:update') && (
            <IconButton title="Editar" onClick={() => form.open(employee)}>
              <Icon name="edit" />
            </IconButton>
          )}
          {can('employees:delete') && (
            <IconButton title={employee.status === 'active' ? 'Dar de baja' : 'Reactivar'} onClick={() => setStatusTarget(employee)}>
              <Icon name={employee.status === 'active' ? 'user-x' : 'user-check'} />
            </IconButton>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Empleados" subtitle="Catálogo de personal, departamentos y turnos.">
        {can('employees:create') && (
          <Button onClick={() => form.open()} disabled={departments.length === 0}>
            <Icon name="plus" /> Nuevo empleado
          </Button>
        )}
      </PageHeader>

      <Toolbar>
        <SearchInput
          id="emp-search"
          placeholder="Buscar por nombre o número..."
          value={filters.q}
          onSearch={(q) => setFilter({ q })}
        />
        <SearchSelect
          id="emp-dept-filter"
          options={departmentOptions}
          value={filters.departamento}
          onChange={(value) => setFilter({ departamento: value })}
          placeholder="Todos los departamentos"
        />
        <Select compact aria-label="Estado" value={filters.estado} onChange={(estado) => setFilter({ estado })} options={STATUS_OPTIONS} />
        <ToolbarSpacer />
        <IconButton title="Exportar" onClick={exportCsv} disabled={exporting}>
          <Icon name="download" />
        </IconButton>
      </Toolbar>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(employee) => employee.employee_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={loadError ?? 'No hay empleados con estos filtros.'}
      />

      {form.isOpen && (
        <EmployeeForm
          key={form.record?.employee_id ?? 'new'}
          employee={form.record}
          departments={departments}
          shifts={shifts}
          onClose={form.close}
          onSaved={handleSaved}
        />
      )}

      {createdAccess && <AccessDialog access={createdAccess} onClose={() => setCreatedAccess(null)} />}

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
