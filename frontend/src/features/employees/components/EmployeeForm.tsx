import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { CreateEmployeeInput, Department, Employee, Shift } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { Drawer } from '../../../components/Drawer';
import { SearchSelect } from '../../../components/SearchSelect';

interface EmployeeFormProps {
  employee: Employee | null;
  departments: Department[];
  shifts: Shift[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

interface FormState {
  employee_name: string;
  employee_number: string;
  folio: string;
  department_id: string;
  shift_id: string;
  start_date: string;
}

const toFormState = (employee: Employee | null, departments: Department[], shifts: Shift[]): FormState => ({
  employee_name: employee?.employee_name ?? '',
  employee_number: employee?.employee_number ?? '',
  folio: employee?.folio ?? '',
  department_id: String(employee?.department_id ?? departments[0]?.department_id ?? ''),
  shift_id: String(employee?.shift_id ?? shifts[0]?.shift_id ?? ''),
  start_date: employee?.start_date.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
});

export function EmployeeForm({ employee, departments, shifts, onClose, onSaved }: EmployeeFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(employee, departments, shifts));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = (field: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => setField(field, e.target.value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.department_id || !form.shift_id) {
      setFormError('Selecciona un departamento y un turno válidos de la lista.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: CreateEmployeeInput = {
      employee_name: form.employee_name,
      employee_number: form.employee_number,
      folio: form.folio,
      department_id: Number(form.department_id),
      shift_id: Number(form.shift_id),
      start_date: form.start_date,
    };

    try {
      if (employee) {
        await sdk.employees.update(employee.employee_id, payload);
        onSaved('Empleado actualizado.');
      } else {
        await sdk.employees.create(payload);
        onSaved('Empleado creado.');
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={employee ? 'Editar empleado' : 'Nuevo empleado'}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {employee ? 'Guardar cambios' : 'Crear empleado'}
          </button>
        </>
      }
    >
      {formError && <p className="field-error">{formError}</p>}

      <div className="field">
        <label htmlFor="f-name">Nombre completo</label>
        <input
          id="f-name"
          value={form.employee_name}
          onChange={handleChange('employee_name')}
          placeholder="Ej. Laura Hernández"
          maxLength={150}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="f-number">Número de empleado</label>
        <input
          id="f-number"
          value={form.employee_number}
          onChange={handleChange('employee_number')}
          placeholder="EMP-0000"
          maxLength={20}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="f-folio">Folio</label>
        <input id="f-folio" value={form.folio} onChange={handleChange('folio')} maxLength={10} required />
      </div>
      <div className="field">
        <label htmlFor="f-department">Departamento</label>
        <SearchSelect
          id="f-department"
          options={departments.map((department) => ({ value: String(department.department_id), label: department.department_name }))}
          value={form.department_id}
          onChange={(value) => setField('department_id', value)}
          placeholder="Busca un departamento..."
          fullWidth
        />
      </div>
      <div className="field">
        <label htmlFor="f-shift">Turno</label>
        <SearchSelect
          id="f-shift"
          options={shifts.map((shift) => ({ value: String(shift.shift_id), label: shift.shift_name }))}
          value={form.shift_id}
          onChange={(value) => setField('shift_id', value)}
          placeholder="Busca un turno..."
          fullWidth
        />
      </div>
      <div className="field">
        <label htmlFor="f-start">Fecha de ingreso</label>
        <input id="f-start" type="date" value={form.start_date} onChange={handleChange('start_date')} required />
      </div>
    </Drawer>
  );
}
