import { HttpClient } from '../http-client';

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

export interface EmployeesPage {
  data: Employee[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
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

const buildQueryString = (params: ListEmployeesParams): string => {
  const query = new URLSearchParams();

  if (params.department_id !== undefined) query.set('department_id', String(params.department_id));
  if (params.status !== undefined) query.set('status', params.status);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize));

  const qs = query.toString();
  return qs ? `?${qs}` : '';
};


export class EmployeesResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListEmployeesParams = {}): Promise<EmployeesPage> {
    return this.http.request<EmployeesPage>(`/api/v1/employees${buildQueryString(params)}`, {
      method: 'GET',
    });
  }

  get(employeeId: number): Promise<Employee> {
    return this.http.request<Employee>(`/api/v1/employees/${employeeId}`, { method: 'GET' });
  }

  create(input: CreateEmployeeInput): Promise<Employee> {
    return this.http.request<Employee>('/api/v1/employees', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  update(employeeId: number, input: UpdateEmployeeInput): Promise<Employee> {
    return this.http.request<Employee>(`/api/v1/employees/${employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  remove(employeeId: number): Promise<void> {
    return this.http.request<void>(`/api/v1/employees/${employeeId}`, { method: 'DELETE' });
  }
}
