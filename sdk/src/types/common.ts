export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface DaysAndHours {
  days: number;
  hours: number;
}

export type RecordStatus = 'active' | 'inactive';

export type AccountStatus = RecordStatus | 'locked';

export type OneOrMany<T> = T | T[];

export interface EmployeeFilterParams {
  search?: string;
  company_id?: OneOrMany<number>;
  branch_id?: OneOrMany<number>;
  department_id?: OneOrMany<number>;
}

export interface ListParams {
  sort?: string;
  page?: number;
  pageSize?: number;
}
