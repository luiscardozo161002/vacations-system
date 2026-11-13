import { useState, type FormEvent } from 'react';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { formatDate } from '../../../lib/format';
import { useAuth } from '../auth-context';
import { LoginCard } from './LoginPage';

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
        <div className="field">
          <label htmlFor="cp-current">Contraseña temporal</label>
          <input
            id="cp-current"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="cp-new">Nueva contraseña</label>
          <input
            id="cp-new"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={100}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <p className="field-hint">Mínimo 8 caracteres.</p>
        </div>
        <div className="field">
          <label htmlFor="cp-confirm">Confirmar contraseña</label>
          <input
            id="cp-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="field-error">{error}</p>}
        <div className="login-foot">
          <button type="button" className="link" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
          Guardar contraseña
        </button>
      </form>
    </LoginCard>
  );
}
