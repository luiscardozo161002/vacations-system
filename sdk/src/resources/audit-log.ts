import { ReadResource } from '../core/crud-resource';
import type { HttpClient } from '../core/http-client';
import type { ListParams, OneOrMany } from '../types/common';

export interface AuditLogEntry {
  log_id: number;
  user_id: number | null;
  event_type: string;
  entity: string | null;
  entity_id: string | null;
  request_id: string | null;
  http_method: string | null;
  route: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: AuditMetadata | null;
  created_at: string;
  username: string | null;
  role_code: string | null;
  actor_name: string | null;
  target_name: string | null;
  result: 'success' | 'failed';
}

export interface AuditMetadata {
  changes?: Record<string, unknown> | null;
  error?: string;
}

export interface ListAuditLogParams extends ListParams {
  user_id?: number;
  event_type?: OneOrMany<string>;
  result?: OneOrMany<'success' | 'failed'>;
  entity?: OneOrMany<string>;
  from?: string;
  to?: string;
  search?: string;
}

export class AuditLogResource extends ReadResource<AuditLogEntry, ListAuditLogParams> {
  constructor(http: HttpClient) {
    super(http, '/auth-audit-log');
  }
}
