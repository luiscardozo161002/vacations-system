import { useMemo, useState, type FormEvent } from 'react';
import type { Employee, Role } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { ROLE_LABELS } from '../../../app/navigation';
import { Drawer } from '../../../components/Drawer';
import { SearchSelect } from '../../../components/SearchSelect';

interface UserFormProps {
  roles: Role[];
  employees: Employee[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

const MIN_PASSWORD = 8;

export function UserForm({ roles, employees, onClose, onSaved }: UserFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(String(roles.find((role) => role.role_code === 'EMPLOYEE')?.role_id ?? ''));
  const [employeeId, setEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: String(employee.employee_id),
        label: `${employee.employee_number} · ${employee.employee_name}`,
      })),
    [employees],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setFormError(`La contraseña inicial necesita al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await sdk.users.create({
        username: username.trim(),
        email: email.trim(),
        password,
        role_id: Number(roleId),
        employee_id: employeeId ? Number(employeeId) : null,
      });
      onSaved('Usuario creado.');
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Nuevo usuario"
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Crear usuario
          </button>
        </>
      }
    >
      {formError && <p className="field-error">{formError}</p>}

      <div className="field">
        <label htmlFor="u-username">Usuario</label>
        <input id="u-username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50} required />
      </div>
      <div className="field">
        <label htmlFor="u-email">Correo</label>
        <input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} required />
      </div>
      <div className="field">
        <label htmlFor="u-password">Contraseña inicial</label>
        <input
          id="u-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="u-role">Rol</label>
        <select id="u-role" value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
          {roles.map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {ROLE_LABELS[role.role_code] ?? role.description}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="u-employee">Empleado vinculado</label>
        <SearchSelect
          id="u-employee"
          options={employeeOptions}
          value={employeeId}
          onChange={setEmployeeId}
          placeholder="Opcional: buscar por número o nombre..."
          fullWidth
        />
      </div>
    </Drawer>
  );
}
