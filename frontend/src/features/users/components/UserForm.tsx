import { useMemo, useState } from 'react';
import type { Role } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { config } from '../../../config';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { ROLE_LABELS } from '../../../layouts/navigation';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { SelectField, TextField } from '../../../components/molecules/FormField';

interface UserFormProps {
  roles: Role[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function UserForm({ roles, onClose, onSaved }: UserFormProps) {
  const adminRoles = useMemo(() => roles.filter((role) => role.role_code !== config.roles.employee), [roles]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(String(adminRoles[0]?.role_id ?? ''));
  const { submitting, error, setError, submit } = useFormSubmit();

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
        options={adminRoles.map((role) => ({ value: role.role_id, label: ROLE_LABELS[role.role_code] ?? role.description }))}
        required
      />
      <p className="text-[12.5px] text-muted">
        Aquí se crean cuentas administrativas. Las cuentas de empleado se crean desde Empleados, con «Crear acceso».
      </p>
    </FormDrawer>
  );
}
