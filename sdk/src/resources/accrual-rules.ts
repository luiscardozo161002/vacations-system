import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ListParams, RecordStatus } from '../types/common';

export interface AccrualRule {
  rule_id: number;
  years_from: number;
  years_to: number | null;
  vacation_days: number;
  effective_year: number;
  status: RecordStatus;
  created_at: string;
}

export interface ListAccrualRulesParams extends ListParams {
  status?: RecordStatus;
  effective_year?: number;
}

export interface CreateAccrualRuleInput {
  years_from: number;
  years_to?: number | null;
  vacation_days: number;
  effective_year: number;
  status?: RecordStatus;
}

export type UpdateAccrualRuleInput = Partial<CreateAccrualRuleInput>;

export class AccrualRulesResource extends CrudResource<
  AccrualRule,
  ListAccrualRulesParams,
  CreateAccrualRuleInput,
  UpdateAccrualRuleInput
> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/vacation-accrual-rules');
  }
}
