import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { DaysAndHours, ListParams, RecordStatus } from '../types/common';

export interface VacationEntitlement {
  entitlement_id: number;
  employee_id: number;
  period_year: number;
  period_start: string;
  period_end: string;
  years_of_service: number;
  rule_id: number;
  total_days: number;
  used_days: number;
  used_hours: number;
  status: RecordStatus;
  generated_at: string;
  employee_name: string | null;
  employee_number: string | null;
  department_name: string | null;
  daily_hours: number;
  available: DaysAndHours;
}

export interface ListVacationEntitlementsParams extends ListParams {
  employee_id?: number;
  period_year?: number;
  status?: RecordStatus;
}

export interface CreateVacationEntitlementInput {
  employee_id: number;
  period_year: number;
  period_start: string;
  period_end: string;
  years_of_service: number;
  rule_id: number;
  total_days: number;
  used_days?: number;
  used_hours?: number;
  status?: RecordStatus;
}

export type UpdateVacationEntitlementInput = Partial<CreateVacationEntitlementInput>;

export interface RolloverSummary {
  date: string;
  created: number;
  expired: number;
  cancelled_requests: number;
  reminders: number;
  skipped: { employee_id: number; reason: string }[];
}

export class VacationEntitlementsResource extends CrudResource<
  VacationEntitlement,
  ListVacationEntitlementsParams,
  CreateVacationEntitlementInput,
  UpdateVacationEntitlementInput
> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/vacation-entitlements');
  }

  generate(date?: string): Promise<RolloverSummary> {
    return this.http.request<RolloverSummary>(`${this.path}/generate`, { method: 'POST', body: date ? { date } : undefined });
  }
}
