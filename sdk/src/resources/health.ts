import { HttpClient } from '../core/http-client';

export interface HealthStatus {
  status: 'ok' | 'error';
  uptimeSeconds: number;
  timestamp: string;
}


export class HealthResource {
  constructor(private readonly http: HttpClient) {}

  check(): Promise<HealthStatus> {
    return this.http.request<HealthStatus>('/api/v1/health', { method: 'GET' });
  }
}
