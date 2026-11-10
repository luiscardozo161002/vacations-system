import { HttpClient } from '../core/http-client';
import type { AuthTokens } from '../core/token-storage';

export type LoginInput =
  | { email: string; username?: never; password: string }
  | { username: string; email?: never; password: string };

export interface SessionTokens extends AuthTokens {
  expiresIn: number;
}

export interface LoginResult extends SessionTokens {
  user: {
    user_id: number;
    username: string;
    email: string;
    role_id: number;
  };
}

export interface CurrentUser {
  user_id: number;
  username: string;
  email: string;
  status: 'active' | 'inactive' | 'locked';
  last_login_at: string | null;
  role: {
    role_id: number;
    role_code: string;
    description: string;
  };
  employee: {
    employee_id: number;
    employee_number: string;
    employee_name: string;
    department_id: number;
    shift_id: number;
  } | null;
  permissions: string[];
}

export interface UpdateMeInput {
  username?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  newPassword: string;
}

export interface PasswordResetRequestResult {
  message: string;
  devToken?: string;
}

export class AuthResource {
  constructor(private readonly http: HttpClient) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const result = await this.http.request<LoginResult>('/api/v1/auth/login', {
      method: 'POST',
      body: input,
      auth: false,
    });
    this.saveTokens(result);
    return result;
  }

  async logout(): Promise<void> {
    const refreshToken = this.http.storage.get()?.refreshToken;
    this.http.storage.set(null);

    if (refreshToken) {
      await this.http.request<void>('/api/v1/auth/logout', { method: 'POST', body: { refreshToken }, auth: false });
    }
  }

  refresh(): Promise<boolean> {
    return this.http.refreshSession();
  }

  isAuthenticated(): boolean {
    return this.http.storage.get() !== null;
  }

  me(options: { signal?: AbortSignal } = {}): Promise<CurrentUser> {
    return this.http.request<CurrentUser>('/api/v1/auth/me', { method: 'GET', signal: options.signal });
  }

  updateMe(input: UpdateMeInput): Promise<CurrentUser> {
    return this.http.request<CurrentUser>('/api/v1/auth/me', { method: 'PATCH', body: input });
  }

  async changePassword(input: ChangePasswordInput): Promise<SessionTokens> {
    const result = await this.http.request<SessionTokens>('/api/v1/auth/me/password', { method: 'POST', body: input });
    this.saveTokens(result);
    return result;
  }

  requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
    return this.http.request<PasswordResetRequestResult>('/api/v1/auth/password-reset/request', {
      method: 'POST',
      body: { email },
      auth: false,
    });
  }

  confirmPasswordReset(input: PasswordResetConfirmInput): Promise<{ message: string }> {
    return this.http.request<{ message: string }>('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      body: input,
      auth: false,
    });
  }

  private saveTokens({ accessToken, refreshToken }: AuthTokens): void {
    this.http.storage.set({ accessToken, refreshToken });
  }
}
