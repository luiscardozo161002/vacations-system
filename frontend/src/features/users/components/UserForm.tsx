import { useMemo, useState } from 'react';
import type { Employee, Role } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { config } from '../../../config';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { ROLE_LABELS } from '../../../app/navigation';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { SearchSelect } from '../../../components/molecules/SearchSelect';
import { FormField, SelectField, TextField } from '../../../components/molecules/FormField';

interface UserFormProps {
  roles: Role[];
  employees: Employee[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function UserForm({ roles, employees, onClose, onSaved }: UserFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(String(roles.find((role) => role.role_code === config.roles.employee)?.role_id ?? ''));
  const [employeeId, setEmployeeId] = useState('');
  const { submitting, error, setError, submit } = useFormSubmit();

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: String(employee.employee_id),
        label: `${employee.employee_number} · ${employee.employee_name}`,
      })),
    [employees],
  );

  const handleSubmit = () => {
    if (password.length < config.passwordMinLength) {
      setError(`La contraseña inicial necesita al menos ${config.passwordMinLength} caracteres.`);
      return;
    }

    submit(async () => {
      await sdk.users.create({
        username: username.trim(),
        email: email.trim(),
        password,
        role_id: Number(roleId),
        employee_id: employeeId ? Number(employeeId) : null,
      });
      onSaved('Usuario creado.');
    });
  };

  return (
    <FormDrawer
      title="Nuevo usuario"
      submitLabel="Crear usuario"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField id="u-username" label="Usuario" value={username} onChange={setUsername} maxLength={50} required />
      <TextField id="u-email" label="Correo" type="email" value={email} onChange={setEmail} maxLength={120} required />
      <TextField
        id="u-password"
        label="Contraseña inicial"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        required
      />
      <SelectField
        id="u-role"
        label="Rol"
        value={roleId}
        onChange={setRoleId}
        options={roles.map((role) => ({ value: role.role_id, label: ROLE_LABELS[role.role_code] ?? role.description }))}
        required
      />
      <FormField label="Empleado vinculado" htmlFor="u-employee">
        <SearchSelect
          id="u-employee"
          options={employeeOptions}
          value={employeeId}
          onChange={setEmployeeId}
          placeholder="Opcional: buscar por número o nombre..."
          fullWidth
        />
      </FormField>
    </FormDrawer>
  );
}
