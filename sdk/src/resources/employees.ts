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
  account?: EmployeeAccount | null;
}

export interface EmployeeAccount {
  user_id: number;
  username: string;
  email: string;
  status: 'active' | 'inactive' | 'locked';
  must_change_password: boolean;
  temporary_password_expires_at: string | null;
  last_login_at: string | null;
  role_code: string;
}

export interface EmployeeAccess {
  account: EmployeeAccount;
  temporary_password: string;
}

export interface CreatedEmployee extends Employee {
  temporary_password?: string;
}

export interface ListEmployeesParams {
  search?: string;
  company_id?: number;
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
  email?: string;
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

  override create(input: CreateEmployeeInput): Promise<CreatedEmployee> {
    return this.http.request<CreatedEmployee>(this.path, { method: 'POST', body: input });
  }

  grantAccess(id: number, email?: string): Promise<EmployeeAccess> {
    return this.http.request<EmployeeAccess>(`${this.path}/${id}/access`, { method: 'POST', body: email ? { email } : {} });
  }
}
