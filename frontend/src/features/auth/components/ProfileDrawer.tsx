import { useState } from 'react';
import type { CurrentUser } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { config } from '../../../lib/config';
import { useFormSubmit } from '../../../lib/use-form-submit';
import { initials } from '../../../lib/format';
import { FormDrawer } from '../../../components/FormDrawer';
import { TextField } from '../../../components/FormField';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../auth-context';

interface ProfileDrawerProps {
  user: CurrentUser;
  roleLabel: string;
  onClose: () => void;
}

export function ProfileDrawer({ user, roleLabel, onClose }: ProfileDrawerProps) {
  const { updateUser } = useAuth();
  const showToast = useToast();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { submitting, error, setError, submit } = useFormSubmit();

  const displayName = user.employee?.employee_name ?? user.username;
  const changingPassword = Boolean(currentPassword || newPassword || confirmPassword);

  const validate = (): string | null => {
    if (!username.trim() || !email.trim()) return 'Nombre y correo son obligatorios.';
    if (!changingPassword) return null;
    if (!currentPassword) return 'Escribe tu contraseña actual para cambiarla.';
    if (newPassword.length < config.passwordMinLength) {
      return `La nueva contraseña debe tener al menos ${config.passwordMinLength} caracteres.`;
    }
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleSubmit = () => {
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    submit(async () => {
      if (changingPassword) {
        await sdk.auth.changePassword({ currentPassword, newPassword });
      }
      const changes = {
        ...(username.trim() !== user.username ? { username: username.trim() } : {}),
        ...(email.trim() !== user.email ? { email: email.trim() } : {}),
      };
      if (Object.keys(changes).length > 0) {
        updateUser(await sdk.auth.updateMe(changes));
      }
      showToast('Perfil actualizado.');
      onClose();
    });
  };

  return (
    <FormDrawer
      title="Editar mi perfil"
      submitLabel="Guardar cambios"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="profile-head">
        <div className="avatar">{initials(displayName)}</div>
        <div>
          <h2 style={{ fontSize: 16 }}>{displayName}</h2>
          <p className="cell-sub">{roleLabel}</p>
        </div>
      </div>
      <TextField id="pf-name" label="Nombre de usuario" value={username} onChange={setUsername} maxLength={50} />
      <TextField
        id="pf-email"
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={setEmail}
        maxLength={120}
      />
      <div className="divider" />
      <p className="cell-sub" style={{ marginBottom: 10 }}>
        Deja la contraseña en blanco si no quieres cambiarla.
      </p>
      <TextField
        id="pf-current-password"
        label="Contraseña actual"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
      />
      <TextField
        id="pf-password"
        label="Nueva contraseña"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        value={newPassword}
        onChange={setNewPassword}
      />
      <TextField
        id="pf-password-confirm"
        label="Confirmar contraseña"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
    </FormDrawer>
  );
}
