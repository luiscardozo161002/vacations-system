import { ApiResource } from '../core/api-resource';
import type { HttpClient } from '../core/http-client';

export interface HealthStatus {
  status: 'ok' | 'error';
  uptimeSeconds: number;
  timestamp: string;
}

export class HealthResource extends ApiResource {
  constructor(http: HttpClient) {
    super(http, '/health');
  }

  check(): Promise<HealthStatus> {
    return this.http.request<HealthStatus>(this.path);
  }
}

