import { useEffect, useState } from 'react';
import type { CreateEmployeeInput, Department, Employee, Shift } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { todayIso } from '../../../utils/format';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { SearchSelect } from '../../../components/molecules/SearchSelect';
import { DatePicker } from '../../../components/molecules/DatePicker';
import { FormField, TextField } from '../../../components/molecules/FormField';
import { describedBy } from '../../../utils/described-by';
import {
  EMAIL_MAX,
  NAME_MAX,
  NUMBER_LENGTH,
  cleanName,
  cleanNumber,
  validateEmployee,
  type EmployeeValues,
} from '../validation';
import type { GrantedAccess } from './AccessDialog';

interface EmployeeFormProps {
  employee: Employee | null;
  departments: Department[];
  shifts: Shift[];
  onClose: () => void;
  onSaved: (message: string, access?: GrantedAccess) => void;
}

const toValues = (employee: Employee | null, departments: Department[], shifts: Shift[]): EmployeeValues => ({
  employee_name: employee?.employee_name ?? '',
  employee_number: employee?.employee_number ?? '',
  department_id: String(employee?.department_id ?? departments[0]?.department_id ?? ''),
  shift_id: String(employee?.shift_id ?? shifts[0]?.shift_id ?? ''),
  start_date: employee?.start_date.slice(0, 10) ?? todayIso(),
  email: '',
});

export function EmployeeForm({ employee, departments, shifts, onClose, onSaved }: EmployeeFormProps) {
  const [initial] = useState(() => toValues(employee, departments, shifts));
  const [form, setForm] = useState<EmployeeValues>(initial);
  const [editing, setEditing] = useState(!employee);
  const [submitted, setSubmitted] = useState(false);
  const { submitting, error, submit } = useFormSubmit();

  const today = todayIso();
  const errors = submitted ? validateEmployee(form, today) : {};
  const changed = (Object.keys(form) as (keyof EmployeeValues)[]).some((field) => form[field] !== initial[field]);

  useEffect(() => {
    if (employee && editing) document.getElementById('f-name')?.focus();
  }, [employee, editing]);

  const setField = (field: keyof EmployeeValues, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    setSubmitted(true);
    return Object.keys(validateEmployee(form, today)).length === 0;
  };

  const handleSubmit = () => {
    const payload: CreateEmployeeInput = {
      employee_name: form.employee_name.trim(),
      employee_number: form.employee_number,
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
      submitDisabled={Boolean(employee) && !changed}
      error={error}
      readOnly={!editing}
      noValidate
      validate={validate}
      confirm={employee ? `¿Guardar los cambios de ${employee.employee_name}?` : undefined}
      onEdit={() => setEditing(true)}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField
        id="f-name"
        label="Nombre completo"
        value={form.employee_name}
        onChange={(value) => setField('employee_name', cleanName(value))}
        placeholder="Ej. Laura Hernández"
        maxLength={NAME_MAX}
        error={errors.employee_name}
        data-autofocus
      />
      <TextField
        id="f-number"
        label="Número de empleado"
        value={form.employee_number}
        onChange={(value) => setField('employee_number', cleanNumber(value))}
        placeholder="0000"
        inputMode="numeric"
        maxLength={NUMBER_LENGTH}
        error={errors.employee_number}
      />
      <FormField label="Departamento" htmlFor="f-department" error={errors.department_id}>
        <SearchSelect
          id="f-department"
          options={departments.map((department) => ({ value: String(department.department_id), label: department.department_name }))}
          value={form.department_id}
          onChange={(value) => setField('department_id', value)}
          placeholder="Busca un departamento..."
          invalid={Boolean(errors.department_id)}
          describedBy={describedBy('f-department', undefined, errors.department_id)}
          fullWidth
        />
      </FormField>
      <FormField label="Turno" htmlFor="f-shift" error={errors.shift_id}>
        <SearchSelect
          id="f-shift"
          options={shifts.map((shift) => ({ value: String(shift.shift_id), label: shift.shift_name }))}
          value={form.shift_id}
          onChange={(value) => setField('shift_id', value)}
          placeholder="Busca un turno..."
          invalid={Boolean(errors.shift_id)}
          describedBy={describedBy('f-shift', undefined, errors.shift_id)}
          fullWidth
        />
      </FormField>
      <FormField label="Fecha de ingreso" htmlFor="f-start" error={errors.start_date}>
        <DatePicker
          id="f-start"
          value={form.start_date}
          onChange={(value) => setField('start_date', value)}
          max={today}
          invalid={Boolean(errors.start_date)}
          describedBy={describedBy('f-start', undefined, errors.start_date)}
        />
      </FormField>
      {!employee && (
        <TextField
          id="f-email"
          label="Correo electrónico"
          type="email"
          value={form.email}
          onChange={(value) => setField('email', value)}
          placeholder="nombre@empresa.com"
          maxLength={EMAIL_MAX}
          error={errors.email}
          hint="Opcional. Si lo escribes, se creará su cuenta con una contraseña temporal válida por un mes."
        />
      )}
    </FormDrawer>
  );
}
