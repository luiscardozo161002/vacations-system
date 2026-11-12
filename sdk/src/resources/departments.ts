import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';

export type DepartmentStatus = 'active' | 'inactive';

export interface Department {
  department_id: number;
  branch_id: number;
  code: string;
  department_name: string;
  manager_employee_id: number | null;
  status: DepartmentStatus;
  created_at: string;
  updated_at: string;
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
  status?: DepartmentStatus;
}

export interface UpdateDepartmentInput {
  branch_id?: number;
  code?: string;
  department_name?: string;
  manager_employee_id?: number | null;
  status?: DepartmentStatus;
}


export class DepartmentsResource extends CrudResource<Department, ListDepartmentsParams, CreateDepartmentInput, UpdateDepartmentInput> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/departments');
  }
}
