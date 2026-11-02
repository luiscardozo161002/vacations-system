import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Department, Employee, EmployeeStatus, Shift } from '@vacations/sdk';
import { sdk } from '../../lib/sdk';
import { getErrorMessage } from '../../lib/get-error-message';
import { EmployeeForm } from './EmployeeForm';

const PAGE_SIZE = 10;

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    sdk.departments
      .list({ pageSize: 100 })
      .then((result) => setDepartments(result.data))
      .catch((err) => setError(getErrorMessage(err)));

    sdk.shifts
      .list({ pageSize: 100 })
      .then((result) => setShifts(result.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sdk.employees.list({
        page,
        pageSize: PAGE_SIZE,
        department_id: departmentFilter ? Number(departmentFilter) : undefined,
        status: statusFilter ? (statusFilter as EmployeeStatus) : undefined,
      });
      setEmployees(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, departmentFilter, statusFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const departmentsById = useMemo(() => {
    const map = new Map<number, Department>();
    for (const department of departments) map.set(department.department_id, department);
    return map;
  }, [departments]);

  const shiftsById = useMemo(() => {
    const map = new Map<number, Shift>();
    for (const shift of shifts) map.set(shift.shift_id, shift);
    return map;
  }, [shifts]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openCreateForm = () => {
    setEditingEmployee(null);
    setFormOpen(true);
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const handleSaved = () => {
    setFormOpen(false);
    loadEmployees();
  };

  const handleDeactivate = async (employee: Employee) => {
    if (!window.confirm(`¿Dar de baja a ${employee.employee_name}?`)) return;
    try {
      await sdk.employees.remove(employee.employee_id);
      loadEmployees();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReactivate = async (employee: Employee) => {
    try {
      await sdk.employees.update(employee.employee_id, { status: 'active' });
      loadEmployees();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Empleados</h1>
        <button type="button" className="button-primary" onClick={openCreateForm} disabled={departments.length === 0}>
          Nuevo empleado
        </button>
      </header>

      {error && <p className="banner banner-error">{error}</p>}

      <div className="toolbar">
        <label>
          Departamento
          <select value={departmentFilter} onChange={(e) => { setPage(1); setDepartmentFilter(e.target.value); }}>
            <option value="">Todos</option>
            {departments.map((department) => (
              <option key={department.department_id} value={department.department_id}>
                {department.department_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Estado
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Numero</th>
            <th>Nombre</th>
            <th>Departamento</th>
            <th>Turno</th>
            <th>Ingreso</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7}>Cargando...</td>
            </tr>
          )}

          {!loading && employees.length === 0 && (
            <tr>
              <td colSpan={7}>No hay empleados con estos filtros.</td>
            </tr>
          )}

          {!loading &&
            employees.map((employee) => (
              <tr key={employee.employee_id}>
                <td>{employee.employee_number}</td>
                <td>{employee.employee_name}</td>
                <td>{departmentsById.get(employee.department_id)?.department_name ?? employee.department_id}</td>
                <td>{shiftsById.get(employee.shift_id)?.shift_name ?? employee.shift_id}</td>
                <td>{employee.start_date.slice(0, 10)}</td>
                <td>
                  <span className={`badge badge-${employee.status}`}>
                    {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-actions">
                  <button type="button" className="button-link" onClick={() => openEditForm(employee)}>
                    Editar
                  </button>
                  {employee.status === 'active' ? (
                    <button type="button" className="button-link button-danger" onClick={() => handleDeactivate(employee)}>
                      Dar de baja
                    </button>
                  ) : (
                    <button type="button" className="button-link" onClick={() => handleReactivate(employee)}>
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="pagination">
        <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
          Anterior
        </button>
        <span>
          Pagina {page} de {totalPages}
        </span>
        <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
          Siguiente
        </button>
      </div>

      {formOpen && (
        <EmployeeForm
          key={editingEmployee?.employee_id ?? 'new'}
          employee={editingEmployee}
          departments={departments}
          shifts={shifts}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
