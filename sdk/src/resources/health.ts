import { HttpClient } from '../http-client';

export interface HealthStatus {
  status: 'ok' | 'error';
  uptimeSeconds: number;
  timestamp: string;
}

/**
 * Recurso "health" del SDK. Cada recurso de la API (employees, notices, vacations...)
 * se agregara como una clase igual a esta, instanciada una vez en VacationsSdk.
 */
export class HealthResource {
  constructor(private readonly http: HttpClient) {}

  check(): Promise<HealthStatus> {
    return this.http.request<HealthStatus>('/api/v1/health', { method: 'GET' });
  }
}
