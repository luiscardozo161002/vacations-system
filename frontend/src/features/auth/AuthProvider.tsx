import { useEffect, useState, type ReactNode } from 'react';
import type { CurrentUser } from '@vacations/sdk';
import { sdk, sessionEvents } from '../../lib/sdk';
import { rememberSession } from '../../lib/session-storage';
import { queryClient } from '../../lib/query-client';
import { AuthContext, type AuthStatus } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (sdk.auth.isAuthenticated() ? 'loading' : 'anonymous'));
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!sdk.auth.isAuthenticated()) return;
    sdk.auth
      .me()
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => setStatus('anonymous'));
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      queryClient.clear();
      setUser(null);
      setStatus('anonymous');
      setNotice('Tu sesión expiró. Vuelve a iniciar sesión.');
    };
    sessionEvents.addEventListener('expired', handleExpired);
    return () => sessionEvents.removeEventListener('expired', handleExpired);
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    rememberSession(remember);
    queryClient.clear();
    await sdk.auth.login({ email, password });
    setUser(await sdk.auth.me());
    setNotice(null);
    setStatus('authenticated');
  };

  const logout = async () => {
    await sdk.auth.logout().catch(() => undefined);
    queryClient.clear();
    setUser(null);
    setStatus('anonymous');
  };

  const can = (permission: string) => user?.permissions.includes(permission) ?? false;

  return (
    <AuthContext.Provider value={{ status, user, notice, login, logout, updateUser: setUser, can }}>
      {children}
    </AuthContext.Provider>
  );
}
