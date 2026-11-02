import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { CreateEmployeeInput, Department, Employee, Shift } from '@vacations/sdk';
import { sdk } from '../../lib/sdk';
import { getErrorMessage } from '../../lib/get-error-message';

interface EmployeeFormProps {
  employee: Employee | null;
  departments: Department[];
  shifts: Shift[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  department_id: string;
  shift_id: string;
  folio: string;
  employee_number: string;
  employee_name: string;
  start_date: string;
  status: 'active' | 'inactive';
}

const toFormState = (employee: Employee | null, departments: Department[], shifts: Shift[]): FormState => ({
  department_id: String(employee?.department_id ?? departments[0]?.department_id ?? ''),
  shift_id: String(employee?.shift_id ?? shifts[0]?.shift_id ?? ''),
  folio: employee?.folio ?? '',
  employee_number: employee?.employee_number ?? '',
  employee_name: employee?.employee_name ?? '',
  start_date: employee?.start_date.slice(0, 10) ?? '',
  status: employee?.status ?? 'active',
});

export function EmployeeForm({ employee, departments, shifts, onClose, onSaved }: EmployeeFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(employee, departments, shifts));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload: CreateEmployeeInput = {
      department_id: Number(form.department_id),
      shift_id: Number(form.shift_id),
      folio: form.folio,
      employee_number: form.employee_number,
      employee_name: form.employee_name,
      start_date: form.start_date,
      status: form.status,
    };

    try {
      if (employee) {
        await sdk.employees.update(employee.employee_id, payload);
      } else {
        await sdk.employees.create(payload);
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>{employee ? 'Editar empleado' : 'Nuevo empleado'}</h2>

        {formError && <p className="banner banner-error">{formError}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Departamento
            <select value={form.department_id} onChange={handleChange('department_id')} required>
              {departments.map((department) => (
                <option key={department.department_id} value={department.department_id}>
                  {department.department_name} ({department.code})
                </option>
              ))}
            </select>
          </label>

          <label>
            Turno
            <select value={form.shift_id} onChange={handleChange('shift_id')} required>
              {shifts.map((shift) => (
                <option key={shift.shift_id} value={shift.shift_id}>
                  {shift.shift_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Folio
            <input type="text" value={form.folio} onChange={handleChange('folio')} maxLength={10} required />
          </label>

          <label>
            Numero de empleado
            <input
              type="text"
              value={form.employee_number}
              onChange={handleChange('employee_number')}
              maxLength={20}
              required
            />
          </label>

          <label>
            Nombre
            <input
              type="text"
              value={form.employee_name}
              onChange={handleChange('employee_name')}
              maxLength={150}
              required
            />
          </label>

          <label>
            Fecha de ingreso
            <input type="date" value={form.start_date} onChange={handleChange('start_date')} required />
          </label>

          {employee && (
            <label>
              Estado
              <select value={form.status} onChange={handleChange('status')}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </label>
          )}

          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="button-primary" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
