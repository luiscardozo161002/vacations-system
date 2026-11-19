import { useState, type FormEvent } from 'react';
import { SdkHttpError } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { getErrorMessage } from '../../../utils/get-error-message';
import { TextField } from '../../../components/molecules/FormField';
import { useAuth } from '../auth-context';
import { DevAccounts } from '../components/DevAccounts';
import { Button } from '../../../components/atoms/Button';
import { Checkbox } from '../../../components/atoms/Checkbox';
import { LinkButton } from '../../../components/atoms/LinkButton';
import { LoginCard } from '../../../components/templates/LoginCard';
import { FieldError, FieldHint } from '../../../components/atoms/FieldText';

type View = 'login' | 'request' | 'confirm';

const LOGIN_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  ACCOUNT_LOCKED: 'Tu cuenta está bloqueada por demasiados intentos fallidos. Intenta de nuevo en 15 minutos.',
  ACCOUNT_INACTIVE: 'Tu usuario está inactivo. Pide a Recursos Humanos que lo reactive.',
  TEMPORARY_PASSWORD_EXPIRED: 'Tu contraseña temporal venció. Pide a Recursos Humanos que te reenvíe el acceso.',
};

const loginErrorMessage = (err: unknown): string =>
  (err instanceof SdkHttpError && LOGIN_ERRORS[err.code]) || getErrorMessage(err);

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
          <TextField
            id="reset-email"
            label="Correo electrónico"
            type="email"
            placeholder="tu.correo@empresa.com"
            value={email}
            onChange={setEmail}
            required
          />
          {error && <FieldError>{error}</FieldError>}
          <div className="mt-1 mb-5 flex items-center justify-between text-sm">
            <LinkButton onClick={() => goTo('login')}>Volver a iniciar sesión</LinkButton>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            Generar código
          </Button>
        </form>
      </LoginCard>
    );
  }

  if (view === 'confirm') {
    return (
      <LoginCard title="Nueva contraseña" subtitle="Escribe el código de restablecimiento y tu nueva contraseña.">
        <form onSubmit={handleConfirm}>
          {message && <FieldHint role="status" className="mb-4">{message}</FieldHint>}
          <TextField id="reset-token" label="Código" value={token} onChange={setToken} required />
          <TextField
            id="reset-password"
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={100}
            value={newPassword}
            onChange={setNewPassword}
            required
            hint="Mínimo 8 caracteres."
          />
          <TextField
            id="reset-password-confirm"
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
          {error && <FieldError>{error}</FieldError>}
          <div className="mt-1 mb-5 flex items-center justify-between text-sm">
            <LinkButton onClick={() => goTo('login')}>Volver a iniciar sesión</LinkButton>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            Guardar contraseña
          </Button>
        </form>
      </LoginCard>
    );
  }

  return (
    <LoginCard title="Inicia sesión" subtitle="Sistema de vacaciones y avisos de ausencia">
      <form onSubmit={handleLogin}>
        {message && <FieldHint role="status" className="mb-4">{message}</FieldHint>}
        <TextField
          id="login-email"
          label="Correo electrónico"
          type="email"
          placeholder="tu.correo@empresa.com"
          autoComplete="username"
          value={email}
          onChange={setEmail}
          required
        />
        <TextField
          id="login-password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />
        {error && <FieldError>{error}</FieldError>}
        <div className="mt-1 mb-5 flex items-center justify-between text-sm">
          <label className="flex items-center gap-1.5 text-muted">
            <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} /> Recordarme
          </label>
          <LinkButton onClick={() => goTo('request')}>¿Olvidaste tu contraseña?</LinkButton>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          Entrar
        </Button>
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
