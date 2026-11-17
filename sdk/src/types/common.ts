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

export type OneOrMany<T> = T | T[];

export interface ListParams {
  sort?: string;
  page?: number;
  pageSize?: number;
}
