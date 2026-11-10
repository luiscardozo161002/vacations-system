import { SdkHttpError } from './api-error';
import { AuthTokens, TokenStorage, memoryStorage } from './token-storage';

export interface SdkClientOptions {
  baseUrl: string;
  storage?: TokenStorage;
  onSessionExpired?: () => void;
}

export type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  auth?: boolean;
}

const buildQueryString = (query?: Record<string, QueryValue>): string => {
  if (!query) return '';

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const raw = await response.text();
  let body: unknown;

  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      if (response.ok) {
        throw new Error('La API devolvio una respuesta JSON invalida');
      }
    }
  }

  if (!response.ok) {
    throw new SdkHttpError(response.status, body);
  }

  return body as T;
};


export class HttpClient {
  readonly storage: TokenStorage;
  private refreshing?: Promise<boolean>;

  constructor(private readonly options: SdkClientOptions) {
    this.storage = options.storage ?? memoryStorage();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    let response = await this.send(path, options);

    if (response.status === 401 && options.auth !== false && (await this.refreshSession())) {
      response = await this.send(path, options);
    }

    return parseResponse<T>(response);
  }

  refreshSession(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = this.renewTokens().finally(() => {
        this.refreshing = undefined;
      });
    }
    return this.refreshing;
  }

  private send(path: string, options: RequestOptions): Promise<Response> {
    const token = options.auth === false ? undefined : this.storage.get()?.accessToken;

    return fetch(`${this.options.baseUrl}${path}${buildQueryString(options.query)}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  }

  private async renewTokens(): Promise<boolean> {
    const refreshToken = this.storage.get()?.refreshToken;
    if (!refreshToken) return false;

    try {
      const tokens = await this.request<AuthTokens>('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      });
      this.storage.set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      return true;
    } catch (err) {
      if (err instanceof SdkHttpError && (err.status === 401 || err.status === 403)) {
        this.storage.set(null);
        this.options.onSessionExpired?.();
        return false;
      }
      throw err;
    }
  }
}
