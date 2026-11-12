import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';

export type DepartmentStatus = 'active' | 'inactive';

export interface Department {
  department_id: number;
  branch_id: number;
  code: string;
  department_name: string;
  manager_employee_id: number | null;
  calendar_shared: boolean;
  status: DepartmentStatus;
  created_at: string;
  updated_at: string;
  manager_name: string | null;
  active_employees: number;
  branch_code: string | null;
  branch_name: string | null;
}

export interface ListDepartmentsParams {
  branch_id?: number;
  status?: DepartmentStatus;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateDepartmentInput {
  branch_id: number;
  code: string;
  department_name: string;
  manager_employee_id?: number | null;
  calendar_shared?: boolean;
  status?: DepartmentStatus;
}

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;


export class DepartmentsResource extends CrudResource<Department, ListDepartmentsParams, CreateDepartmentInput, UpdateDepartmentInput> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/departments');
  }
}
