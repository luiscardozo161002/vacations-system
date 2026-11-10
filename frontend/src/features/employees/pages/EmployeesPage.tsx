import { useEffect, useMemo, useState } from 'react';
import type { Employee, EmployeeStatus } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { formatDate, initials } from '../../../lib/format';
import { Icon } from '../../../components/Icon';
import { useEmployees } from '../hooks/useEmployees';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { useShifts } from '../../shifts/hooks/useShifts';
import { EmployeeForm } from '../components/EmployeeForm';

const PAGE_SIZE = 10;

export function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { departments, error: departmentsError } = useDepartments();
  const { shifts, error: shiftsError } = useShifts();

  const employeesParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      department_id: departmentFilter ? Number(departmentFilter) : undefined,
      status: statusFilter ? (statusFilter as EmployeeStatus) : undefined,
    }),
    [page, departmentFilter, statusFilter],
  );

  const { data, loading, error: listError, reload } = useEmployees(employeesParams);

  const [toast, setToast] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const employees = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);
  const loadError = listError ?? departmentsError ?? shiftsError;

  const departmentsById = useMemo(() => {
    const map = new Map<number, (typeof departments)[number]>();
    for (const department of departments) map.set(department.department_id, department);
    return map;
  }, [departments]);

  const shiftsById = useMemo(() => {
    const map = new Map<number, (typeof shifts)[number]>();
    for (const shift of shifts) map.set(shift.shift_id, shift);
    return map;
  }, [shifts]);

  const openCreateForm = () => {
    setEditingEmployee(null);
    setFormOpen(true);
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const handleSaved = (message: string) => {
    setFormOpen(false);
    setToast(message);
    reload();
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const willDeactivate = statusTarget.status === 'active';
    try {
      if (willDeactivate) {
        await sdk.employees.remove(statusTarget.employee_id);
      } else {
        await sdk.employees.update(statusTarget.employee_id, { status: 'active' });
      }
      setToast(`${statusTarget.employee_name} ${willDeactivate ? 'dada de baja' : 'reactivada'}.`);
      reload();
    } catch (err) {
      setToast(getErrorMessage(err));
    } finally {
      setStatusTarget(null);
    }
  };

  const emptyMessage = loading ? 'Cargando...' : (loadError ?? 'No hay empleados con estos filtros.');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Empleados</h1>
          <p className="page-sub">Catálogo de personal, departamentos y turnos.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openCreateForm} disabled={departments.length === 0}>
            <Icon name="plus" /> Nuevo empleado
          </button>
        </div>
      </div>

      <div className="toolbar">
        <select
          value={departmentFilter}
          onChange={(e) => {
            setPage(1);
            setDepartmentFilter(e.target.value);
          }}
        >
          <option value="">Todos los departamentos</option>
          {departments.map((department) => (
            <option key={department.department_id} value={department.department_id}>
              {department.department_name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Número</th>
              <th>Folio</th>
              <th>Departamento</th>
              <th>Turno</th>
              <th>Ingreso</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(loading || employees.length === 0) && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="mark">
                      <Icon name="inbox" />
                    </div>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              employees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{initials(employee.employee_name)}</div>
                      <span className="cell-main">{employee.employee_name}</span>
                    </div>
                  </td>
                  <td>{employee.employee_number}</td>
                  <td className="cell-sub">{employee.folio}</td>
                  <td>{departmentsById.get(employee.department_id)?.department_name ?? employee.department_id}</td>
                  <td>{shiftsById.get(employee.shift_id)?.shift_name ?? employee.shift_id}</td>
                  <td>{formatDate(employee.start_date)}</td>
                  <td>
                    {employee.status === 'active' ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-neutral">Inactivo</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-btn" title="Editar" onClick={() => openEditForm(employee)}>
                        <Icon name="edit" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title={employee.status === 'active' ? 'Dar de baja' : 'Reactivar'}
                        onClick={() => setStatusTarget(employee)}
                      >
                        <Icon name={employee.status === 'active' ? 'user-x' : 'user-check'} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="table-foot">
          <span>
            {total} resultado{total === 1 ? '' : 's'}
          </span>
          <div className="pagination">
            <button type="button" className="icon-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              <Icon name="chevron-left" />
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              <Icon name="chevron-right" />
            </button>
          </div>
        </div>
      </div>

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

      {statusTarget && (
        <div
          className="overlay center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStatusTarget(null);
          }}
        >
          <div className="dialog" role="dialog" aria-modal="true">
            <div className="dialog-head">
              <h2>{statusTarget.status === 'active' ? 'Dar de baja empleado' : 'Reactivar empleado'}</h2>
              <button type="button" className="icon-btn" onClick={() => setStatusTarget(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="dialog-body">
              <p>
                ¿Confirmas {statusTarget.status === 'active' ? 'dar de baja a' : 'reactivar a'}{' '}
                <strong>{statusTarget.employee_name}</strong>?
              </p>
            </div>
            <div className="dialog-foot">
              <button type="button" className="btn btn-secondary" onClick={() => setStatusTarget(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmStatusChange}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="toast-stack">
        {toast && (
          <div className="toast">
            <Icon name="check" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </>
  );
}
