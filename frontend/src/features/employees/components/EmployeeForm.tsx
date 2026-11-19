import { useState } from 'react';
import type { CreateEmployeeInput, Department, Employee, Shift } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { useFormSubmit } from '../../../lib/use-form-submit';
import { FormDrawer } from '../../../components/FormDrawer';
import { SearchSelect } from '../../../components/SearchSelect';
import { FormField, TextField } from '../../../components/FormField';
import type { GrantedAccess } from './AccessDialog';

interface EmployeeFormProps {
  employee: Employee | null;
  departments: Department[];
  shifts: Shift[];
  onClose: () => void;
  onSaved: (message: string, access?: GrantedAccess) => void;
}

interface FormState {
  employee_name: string;
  employee_number: string;
  folio: string;
  department_id: string;
  shift_id: string;
  start_date: string;
  email: string;
}

const toFormState = (employee: Employee | null, departments: Department[], shifts: Shift[]): FormState => ({
  employee_name: employee?.employee_name ?? '',
  employee_number: employee?.employee_number ?? '',
  folio: employee?.folio ?? '',
  department_id: String(employee?.department_id ?? departments[0]?.department_id ?? ''),
  shift_id: String(employee?.shift_id ?? shifts[0]?.shift_id ?? ''),
  start_date: employee?.start_date.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  email: '',
});

export function EmployeeForm({ employee, departments, shifts, onClose, onSaved }: EmployeeFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(employee, departments, shifts));
  const { submitting, error, setError, submit } = useFormSubmit();

  const setField = (field: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.department_id || !form.shift_id) {
      setError('Selecciona un departamento y un turno válidos de la lista.');
      return;
    }

    const payload: CreateEmployeeInput = {
      employee_name: form.employee_name,
      employee_number: form.employee_number,
      folio: form.folio,
      department_id: Number(form.department_id),
      shift_id: Number(form.shift_id),
      start_date: form.start_date,
    };

    submit(async () => {
      if (employee) {
        await sdk.employees.update(employee.employee_id, payload);
        onSaved('Empleado actualizado.');
      } else {
        const email = form.email.trim();
        const created = await sdk.employees.create(email ? { ...payload, email } : payload);
        const access =
          created.account && created.temporary_password
            ? { employee_name: created.employee_name, account: created.account, temporary_password: created.temporary_password }
            : undefined;
        onSaved('Empleado creado.', access);
      }
    });
  };

  return (
    <FormDrawer
      title={employee ? 'Editar empleado' : 'Nuevo empleado'}
      submitLabel={employee ? 'Guardar cambios' : 'Crear empleado'}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField
        id="f-name"
        label="Nombre completo"
        value={form.employee_name}
        onChange={(value) => setField('employee_name', value)}
        placeholder="Ej. Laura Hernández"
        maxLength={150}
        required
      />
      <TextField
        id="f-number"
        label="Número de empleado"
        value={form.employee_number}
        onChange={(value) => setField('employee_number', value)}
        placeholder="EMP-0000"
        maxLength={20}
        required
      />
      <TextField
        id="f-folio"
        label="Folio"
        value={form.folio}
        onChange={(value) => setField('folio', value)}
        maxLength={10}
        required
      />
      <FormField label="Departamento" htmlFor="f-department">
        <SearchSelect
          id="f-department"
          options={departments.map((department) => ({ value: String(department.department_id), label: department.department_name }))}
          value={form.department_id}
          onChange={(value) => setField('department_id', value)}
          placeholder="Busca un departamento..."
          fullWidth
        />
      </FormField>
      <FormField label="Turno" htmlFor="f-shift">
        <SearchSelect
          id="f-shift"
          options={shifts.map((shift) => ({ value: String(shift.shift_id), label: shift.shift_name }))}
          value={form.shift_id}
          onChange={(value) => setField('shift_id', value)}
          placeholder="Busca un turno..."
          fullWidth
        />
      </FormField>
      <TextField
        id="f-start"
        label="Fecha de ingreso"
        type="date"
        value={form.start_date}
        onChange={(value) => setField('start_date', value)}
        required
      />
      {!employee && (
        <TextField
          id="f-email"
          label="Correo electrónico"
          type="email"
          value={form.email}
          onChange={(value) => setField('email', value)}
          placeholder="nombre@empresa.com"
          maxLength={120}
          hint="Se creará su cuenta con una contraseña temporal válida por un mes."
        />
      )}
    </FormDrawer>
  );
}
