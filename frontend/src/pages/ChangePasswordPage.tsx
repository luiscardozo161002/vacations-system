import { useState, type FormEvent } from 'react';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { getErrorMessage } from '../utils/get-error-message';
import { formatDate } from '../utils/format';
import { TextField } from '../components/molecules/FormField';
import { useAuth } from '../contexts/auth-context';
import { LoginCard } from '../layouts/LoginCard';
import { LinkButton } from '../components/atoms/LinkButton';
import { Button } from '../components/atoms/Button';
import { FieldError } from '../components/atoms/FieldText';

export function ChangePasswordPage() {
  const { user, updateUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const expires = user?.temporary_password_expires_at;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser distinta de la temporal.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sdk.auth.changePassword({ currentPassword, newPassword });
      updateUser(await sdk.auth.me());
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <LoginCard
      title="Crea tu contraseña"
      subtitle={`Entraste con una contraseña temporal${expires ? ` que vence el ${formatDate(expires)}` : ''}. Cámbiala para continuar.`}
    >
      <form onSubmit={handleSubmit}>
        <TextField
          id="cp-current"
          label="Contraseña temporal"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
          required
        />
        <TextField
          id="cp-new"
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          minLength={config.passwordMinLength}
          maxLength={100}
          value={newPassword}
          onChange={setNewPassword}
          required
          hint={`Mínimo ${config.passwordMinLength} caracteres.`}
        />
        <TextField
          id="cp-confirm"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
        />
        {error && <FieldError>{error}</FieldError>}
        <div className="mt-1 mb-5 flex items-center justify-between text-sm">
          <LinkButton onClick={logout}>Cerrar sesión</LinkButton>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          Guardar contraseña
        </Button>
      </form>
    </LoginCard>
  );
}
