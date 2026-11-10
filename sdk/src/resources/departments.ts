import { HttpClient } from '../core/http-client';
import type { Paginated } from '../types/common';

export type DepartmentStatus = 'active' | 'inactive';

export interface Department {
  department_id: number;
  company_id: number;
  code: string;
  department_name: string;
  manager_employee_id: number | null;
  status: DepartmentStatus;
  created_at: string;
  updated_at: string;
}

export interface ListDepartmentsParams {
  company_id?: number;
  status?: DepartmentStatus;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateDepartmentInput {
  company_id: number;
  code: string;
  department_name: string;
  manager_employee_id?: number | null;
  status?: DepartmentStatus;
}

export interface UpdateDepartmentInput {
  company_id?: number;
  code?: string;
  department_name?: string;
  manager_employee_id?: number | null;
  status?: DepartmentStatus;
}


export class DepartmentsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListDepartmentsParams = {}, options: { signal?: AbortSignal } = {}): Promise<Paginated<Department>> {
    return this.http.request<Paginated<Department>>('/api/v1/departments', {
      method: 'GET',
      query: { ...params },
      signal: options.signal,
    });
  }

  get(departmentId: number, options: { signal?: AbortSignal } = {}): Promise<Department> {
    return this.http.request<Department>(`/api/v1/departments/${departmentId}`, {
      method: 'GET',
      signal: options.signal,
    });
  }

  create(input: CreateDepartmentInput): Promise<Department> {
    return this.http.request<Department>('/api/v1/departments', { method: 'POST', body: input });
  }

  update(departmentId: number, input: UpdateDepartmentInput): Promise<Department> {
    return this.http.request<Department>(`/api/v1/departments/${departmentId}`, { method: 'PATCH', body: input });
  }

  remove(departmentId: number): Promise<void> {
    return this.http.request<void>(`/api/v1/departments/${departmentId}`, { method: 'DELETE' });
  }
}
