import { useState, type FormEvent, type ReactNode } from 'react';
import { SdkHttpError } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { Icon } from '../../../components/Icon';
import { useAuth } from '../auth-context';
import { DevAccounts } from '../components/DevAccounts';

type View = 'login' | 'request' | 'confirm';

const LOGIN_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  ACCOUNT_LOCKED: 'Tu cuenta está bloqueada por demasiados intentos fallidos. Intenta de nuevo en 15 minutos.',
  ACCOUNT_INACTIVE: 'Tu usuario está inactivo. Pide a Recursos Humanos que lo reactive.',
  TEMPORARY_PASSWORD_EXPIRED: 'Tu contraseña temporal venció. Pide a Recursos Humanos que te reenvíe el acceso.',
};

const loginErrorMessage = (err: unknown): string =>
  (err instanceof SdkHttpError && LOGIN_ERRORS[err.code]) || getErrorMessage(err);

export function LoginCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div id="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="mark">
            <Icon name="calendar-check" />
          </div>
          <strong>Vacation Manager</strong>
        </div>
        <h1>{title}</h1>
        <p className="login-sub">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, notice } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(notice);
  const [submitting, setSubmitting] = useState(false);

  const goTo = (next: View) => {
    setError(null);
    setMessage(null);
    setView(next);
  };

  const submit = (action: () => Promise<void>, toMessage: (err: unknown) => string) => async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = submit(() => login(email.trim(), password, remember), loginErrorMessage);

  const handleRequest = submit(async () => {
    const result = await sdk.auth.requestPasswordReset(email.trim());
    setToken(result.devToken ?? '');
    setView('confirm');
    setMessage('Si el correo está registrado, se generó un código de restablecimiento.');
  }, getErrorMessage);

  const confirmReset = submit(async () => {
    await sdk.auth.confirmPasswordReset({ token: token.trim(), newPassword });
    setPassword('');
    setView('login');
    setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
  }, getErrorMessage);

  const handleConfirm = (e: FormEvent) => {
    if (newPassword === confirmPassword) return confirmReset(e);
    e.preventDefault();
    setError('Las contraseñas no coinciden.');
  };

  if (view === 'request') {
    return (
      <LoginCard title="Restablecer contraseña" subtitle="Escribe tu correo para generar un código de restablecimiento.">
        <form onSubmit={handleRequest}>
          <div className="field">
            <label htmlFor="reset-email">Correo electrónico</label>
            <input
              id="reset-email"
              type="email"
              placeholder="tu.correo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="field-error">{error}</p>}
          <div className="login-foot">
            <button type="button" className="link" onClick={() => goTo('login')}>
              Volver a iniciar sesión
            </button>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            Generar código
          </button>
        </form>
      </LoginCard>
    );
  }

  if (view === 'confirm') {
    return (
      <LoginCard title="Nueva contraseña" subtitle="Escribe el código de restablecimiento y tu nueva contraseña.">
        <form onSubmit={handleConfirm}>
          {message && <p className="field-hint" style={{ marginBottom: 16 }}>{message}</p>}
          <div className="field">
            <label htmlFor="reset-token">Código</label>
            <input id="reset-token" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="reset-password">Nueva contraseña</label>
            <input
              id="reset-password"
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
            <label htmlFor="reset-password-confirm">Confirmar contraseña</label>
            <input
              id="reset-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="field-error">{error}</p>}
          <div className="login-foot">
            <button type="button" className="link" onClick={() => goTo('login')}>
              Volver a iniciar sesión
            </button>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            Guardar contraseña
          </button>
        </form>
      </LoginCard>
    );
  }

  return (
    <LoginCard title="Inicia sesión" subtitle="Sistema de vacaciones y avisos de ausencia">
      <form onSubmit={handleLogin}>
        {message && <p className="field-hint" style={{ marginBottom: 16 }}>{message}</p>}
        <div className="field">
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            placeholder="tu.correo@empresa.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="field-error">{error}</p>}
        <div className="login-foot">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Recordarme
          </label>
          <button type="button" className="link" onClick={() => goTo('request')}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
          Entrar
        </button>
      </form>

      {import.meta.env.DEV && (
        <DevAccounts
          onPick={(pickedEmail, pickedPassword) => {
            setEmail(pickedEmail);
            setPassword(pickedPassword);
            setError(null);
          }}
        />
      )}
    </LoginCard>
  );
}
