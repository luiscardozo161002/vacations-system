import { HttpClient } from '../http-client';

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
  page?: number;
  pageSize?: number;
}

export interface DepartmentsPage {
  data: Department[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
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

const buildQueryString = (params: ListDepartmentsParams): string => {
  const query = new URLSearchParams();

  if (params.company_id !== undefined) query.set('company_id', String(params.company_id));
  if (params.status !== undefined) query.set('status', params.status);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize));

  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

/**
 * Recurso "departments" del SDK. Sigue el mismo patron que EmployeesResource.
 */
export class DepartmentsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListDepartmentsParams = {}): Promise<DepartmentsPage> {
    return this.http.request<DepartmentsPage>(`/api/v1/departments${buildQueryString(params)}`, {
      method: 'GET',
    });
  }

  get(departmentId: number): Promise<Department> {
    return this.http.request<Department>(`/api/v1/departments/${departmentId}`, { method: 'GET' });
  }

  create(input: CreateDepartmentInput): Promise<Department> {
    return this.http.request<Department>('/api/v1/departments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  update(departmentId: number, input: UpdateDepartmentInput): Promise<Department> {
    return this.http.request<Department>(`/api/v1/departments/${departmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  /** Borrado logico: el backend hace status = 'inactive', nunca un DELETE real. */
  remove(departmentId: number): Promise<void> {
    return this.http.request<void>(`/api/v1/departments/${departmentId}`, { method: 'DELETE' });
  }
}
