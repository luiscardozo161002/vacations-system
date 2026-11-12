import { HttpClient } from '../core/http-client';
import { CallOptions, toQuery } from '../core/crud-resource';
import type { ListParams, Paginated } from '../types/common';

export interface AuditLogEntry {
  log_id: number;
  user_id: number | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: unknown;
  created_at: string;
}

export interface ListAuditLogParams extends ListParams {
  user_id?: number;
  event_type?: string;
}

const PATH = '/api/v1/auth-audit-log';

export class AuditLogResource {
  constructor(private readonly http: HttpClient) {}

  list(params?: ListAuditLogParams, options: CallOptions = {}): Promise<Paginated<AuditLogEntry>> {
    return this.http.request<Paginated<AuditLogEntry>>(PATH, {
      method: 'GET',
      query: toQuery(params),
      signal: options.signal,
    });
  }

  get(logId: number, options: CallOptions = {}): Promise<AuditLogEntry> {
    return this.http.request<AuditLogEntry>(`${PATH}/${logId}`, { method: 'GET', signal: options.signal });
  }
}
