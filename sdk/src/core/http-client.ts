import { SdkHttpError } from './api-error';

export interface SdkClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
}

export type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
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


export class HttpClient {
  constructor(private readonly options: SdkClientOptions) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = await this.options.getAccessToken?.();

    const response = await fetch(`${this.options.baseUrl}${path}${buildQueryString(options.query)}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

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
  }
}
