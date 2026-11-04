import { HttpClient } from '../core/http-client';
import type { Paginated } from '../types/common';

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

export class EmployeesResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListEmployeesParams = {}, options: { signal?: AbortSignal } = {}): Promise<Paginated<Employee>> {
    return this.http.request<Paginated<Employee>>('/api/v1/employees', {
      method: 'GET',
      query: { ...params },
      signal: options.signal,
    });
  }

  get(employeeId: number, options: { signal?: AbortSignal } = {}): Promise<Employee> {
    return this.http.request<Employee>(`/api/v1/employees/${employeeId}`, {
      method: 'GET',
      signal: options.signal,
    });
  }

  create(input: CreateEmployeeInput): Promise<Employee> {
    return this.http.request<Employee>('/api/v1/employees', { method: 'POST', body: input });
  }

  update(employeeId: number, input: UpdateEmployeeInput): Promise<Employee> {
    return this.http.request<Employee>(`/api/v1/employees/${employeeId}`, { method: 'PATCH', body: input });
  }

  remove(employeeId: number): Promise<void> {
    return this.http.request<void>(`/api/v1/employees/${employeeId}`, { method: 'DELETE' });
  }
}
