import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';

export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  employee_id: number;
  department_id: number;
  shift_id: number;
  folio: string;
  employee_number: string;
  employee_name: string;
  start_date: string;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

export interface ListEmployeesParams {
  department_id?: number;
  status?: EmployeeStatus;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateEmployeeInput {
  department_id: number;
  shift_id: number;
  folio: string;
  employee_number: string;
  employee_name: string;
  start_date: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeInput {
  department_id?: number;
  shift_id?: number;
  folio?: string;
  employee_number?: string;
  employee_name?: string;
  start_date?: string;
  status?: EmployeeStatus;
}

export class EmployeesResource extends CrudResource<Employee, ListEmployeesParams, CreateEmployeeInput, UpdateEmployeeInput> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/employees');
  }
}
