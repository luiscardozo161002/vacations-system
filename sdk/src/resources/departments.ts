import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ListParams, RecordStatus } from '../types/common';

export type DepartmentStatus = RecordStatus;

export interface Department {
  department_id: number;
  branch_id: number;
  code: string;
  department_name: string;
  manager_employee_id: number | null;
  calendar_shared: boolean;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
  manager_name: string | null;
  active_employees: number;
  branch_code: string | null;
  branch_name: string | null;
  branch_color: string | null;
  company_id: number | null;
  company_folio: string | null;
  company_name: string | null;
  company_color: string | null;
}

export interface ListDepartmentsParams extends ListParams {
  branch_id?: number;
  status?: RecordStatus;
}

export interface CreateDepartmentInput {
  branch_id: number;
  code: string;
  department_name: string;
  manager_employee_id?: number | null;
  calendar_shared?: boolean;
  status?: RecordStatus;
}

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export class DepartmentsResource extends CrudResource<Department, ListDepartmentsParams, CreateDepartmentInput, UpdateDepartmentInput> {
  constructor(http: HttpClient) {
    super(http, '/departments');
  }
}
