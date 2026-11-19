import { SdkHttpError } from './api-error';
import { AuthTokens, TokenStorage, memoryStorage } from './token-storage';

const DEFAULT_API_PREFIX = '/api/v1';
const REFRESH_PATH = '/auth/refresh';
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

type QueryScalar = string | number | boolean;
export type QueryValue = QueryScalar | QueryScalar[] | undefined | null;

export interface SdkClientOptions {
  baseUrl: string;
  apiPrefix?: string;
  storage?: TokenStorage;
  onSessionExpired?: () => void;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: object;
  signal?: AbortSignal;
  auth?: boolean;
}

const buildQueryString = (query: object = {}): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const raw = await response.text();
  let body: unknown;

  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      if (response.ok) throw new Error('La API devolvió una respuesta JSON inválida');
    }
  }

  if (!response.ok) throw new SdkHttpError(response.status, body);

  return body as T;
};

export class HttpClient {
  readonly storage: TokenStorage;
  private readonly apiUrl: string;
  private refreshing?: { refreshToken: string; promise: Promise<boolean> };

  constructor(private readonly options: SdkClientOptions) {
    this.storage = options.storage ?? memoryStorage();
    this.apiUrl = `${options.baseUrl}${options.apiPrefix ?? DEFAULT_API_PREFIX}`;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return parseResponse<T>(await this.sendWithRefresh(path, options));
  }

  async requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
    const response = await this.sendWithRefresh(path, options);
    if (!response.ok) return parseResponse<never>(response);
    return response.blob();
  }

  refreshSession(): Promise<boolean> {
    const refreshToken = this.storage.get()?.refreshToken;
    if (!refreshToken) return Promise.resolve(false);
    if (this.refreshing?.refreshToken === refreshToken) {
      return this.refreshing.promise;
    }

    const promise = this.renewTokens(refreshToken).finally(() => {
      if (this.refreshing?.promise === promise) this.refreshing = undefined;
    });
    this.refreshing = { refreshToken, promise };
    return promise;
  }

  private async sendWithRefresh(path: string, options: RequestOptions): Promise<Response> {
    const response = await this.send(path, options);
    if (response.status === UNAUTHORIZED && options.auth !== false && (await this.refreshSession())) {
      return this.send(path, options);
    }
    return response;
  }

  private send(path: string, options: RequestOptions): Promise<Response> {
    const token = options.auth === false ? undefined : this.storage.get()?.accessToken;
    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${this.apiUrl}${path}${buildQueryString(options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  }

  private async renewTokens(refreshToken: string): Promise<boolean> {
    try {
      const tokens = await this.request<AuthTokens>(REFRESH_PATH, {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      });
      if (this.storage.get()?.refreshToken !== refreshToken) return false;
      this.storage.set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      return true;
    } catch (err) {
      if (this.storage.get()?.refreshToken !== refreshToken) return false;
      if (err instanceof SdkHttpError && (err.status === UNAUTHORIZED || err.status === FORBIDDEN)) {
        this.storage.set(null);
        this.options.onSessionExpired?.();
        return false;
      }
      throw err;
    }
  }
}
