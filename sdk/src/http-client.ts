export interface SdkClientOptions {
  /** URL base de la API, p. ej. "https://api.vacations.com" o "http://localhost:3000" */
  baseUrl: string;
  /** Devuelve el token de acceso actual (sesion/usuario), si aplica. */
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

/**
 * El backend responde siempre los errores HTTP (sean de negocio, de validacion
 * o de base de datos) con el shape { error: { code, message } } (ver
 * backend/src/lib/error-handler.js). Esta clase extrae code/message de ahi para
 * que el frontend pueda mostrar error.message directamente, sin tener que
 * conocer ese shape ni navegar error.body.
 */
export class SdkHttpError extends Error {
  public readonly code: string;

  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    const apiError = (body as ApiErrorBody | undefined)?.error;
    super(apiError?.message ?? `La peticion fallo con estado ${status}`);
    this.name = 'SdkHttpError';
    this.code = apiError?.code ?? 'UNKNOWN_ERROR';
  }
}

/**
 * Cliente HTTP base del SDK. Los recursos (HealthResource, EmployeesResource, ...)
 * lo reciben por constructor y lo usan para hablar con la API; nunca hacen fetch
 * directamente, asi toda la autenticacion y el manejo de errores queda centralizado aqui.
 */
export class HttpClient {
  constructor(private readonly options: SdkClientOptions) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.options.getAccessToken?.();

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    const body = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new SdkHttpError(response.status, body);
    }

    return body as T;
  }
}
