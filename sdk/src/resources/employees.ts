import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { AccountStatus, ListParams, OneOrMany, RecordStatus } from '../types/common';

export type EmployeeStatus = RecordStatus;

export interface Employee {
  employee_id: number;
  department_id: number;
  shift_id: number;
  employee_number: string;
  employee_name: string;
  start_date: string;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
  account?: EmployeeAccount | null;
}

export interface EmployeeAccount {
  user_id: number;
  username: string;
  email: string;
  status: AccountStatus;
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

export interface ListEmployeesParams extends ListParams {
  search?: string;
  company_id?: number;
  department_id?: OneOrMany<number>;
  status?: OneOrMany<RecordStatus>;
  hired_from?: string;
  hired_to?: string;
}

export type ExportEmployeesParams = Omit<ListEmployeesParams, keyof ListParams>;

export interface CreateEmployeeInput {
  department_id: number;
  shift_id: number;
  employee_number: string;
  employee_name: string;
  start_date: string;
  status?: RecordStatus;
  email?: string;
}

export type UpdateEmployeeInput = Partial<Omit<CreateEmployeeInput, 'email'>>;

export class EmployeesResource extends CrudResource<Employee, ListEmployeesParams, CreateEmployeeInput, UpdateEmployeeInput> {
  constructor(http: HttpClient) {
    super(http, '/employees');
  }

  override create(input: CreateEmployeeInput): Promise<CreatedEmployee> {
    return this.http.request<CreatedEmployee>(this.path, { method: 'POST', body: input });
  }

  exportCsv(params?: ExportEmployeesParams): Promise<Blob> {
    return this.http.requestBlob(`${this.path}/export`, { query: params });
  }

  grantAccess(id: number, email?: string): Promise<EmployeeAccess> {
    return this.http.request<EmployeeAccess>(`${this.path}/${id}/access`, { method: 'POST', body: email ? { email } : {} });
  }
}
