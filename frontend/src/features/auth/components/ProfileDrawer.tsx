import { useState, type FormEvent } from 'react';
import type { CurrentUser } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { initials } from '../../../lib/format';
import { Drawer } from '../../../components/Drawer';
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const displayName = user.employee?.employee_name ?? user.username;
  const changingPassword = Boolean(currentPassword || newPassword || confirmPassword);

  const validate = (): string | null => {
    if (!username.trim() || !email.trim()) return 'Nombre y correo son obligatorios.';
    if (!changingPassword) return null;
    if (!currentPassword) return 'Escribe tu contraseña actual para cambiarla.';
    if (newPassword.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.';
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setSubmitting(true);
    try {
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
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Editar mi perfil"
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Guardar cambios
          </button>
        </>
      }
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
      {error && <p className="field-error">{error}</p>}
    </Drawer>
  );
}
