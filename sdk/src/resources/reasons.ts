import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ListParams, RecordStatus } from '../types/common';

export interface Reason {
  reason_id: number;
  description: string;
  requires_approval: boolean;
  affects_vacation_balance: boolean;
  status: RecordStatus;
}

export interface ListReasonsParams extends ListParams {
  requires_approval?: boolean;
  affects_vacation_balance?: boolean;
  status?: RecordStatus;
}

export interface CreateReasonInput {
  description: string;
  requires_approval?: boolean;
  affects_vacation_balance?: boolean;
  status?: RecordStatus;
}

export type UpdateReasonInput = Partial<CreateReasonInput>;

export class ReasonsResource extends CrudResource<Reason, ListReasonsParams, CreateReasonInput, UpdateReasonInput> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/reasons');
  }
}
