import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ListParams, RecordStatus } from '../types/common';

export interface Branch {
  branch_id: number;
  company_id: number;
  code: string;
  branch_name: string;
  color: string | null;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
  active_employees: number;
  company_folio: string | null;
  company_name: string | null;
  company_color: string | null;
}

export interface ListBranchesParams extends ListParams {
  company_id?: number;
  status?: RecordStatus;
}

export interface CreateBranchInput {
  company_id: number;
  code: string;
  branch_name: string;
  color?: string | null;
  status?: RecordStatus;
}

export type UpdateBranchInput = Partial<CreateBranchInput>;

export class BranchesResource extends CrudResource<Branch, ListBranchesParams, CreateBranchInput, UpdateBranchInput> {
  constructor(http: HttpClient) {
    super(http, '/branches');
  }
}
