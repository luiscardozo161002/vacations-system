import { HttpClient } from '../http-client';

export type ShiftStatus = 'active' | 'inactive';

export interface Shift {
  shift_id: number;
  code: string;
  shift_name: string;
  number_days: number;
  status: ShiftStatus;
  created_at: string;
  updated_at: string;
}

export interface ListShiftsParams {
  status?: ShiftStatus;
  page?: number;
  pageSize?: number;
}

export interface ShiftsPage {
  data: Shift[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface CreateShiftInput {
  code: string;
  shift_name: string;
  number_days: number;
  status?: ShiftStatus;
}

export interface UpdateShiftInput {
  code?: string;
  shift_name?: string;
  number_days?: number;
  status?: ShiftStatus;
}

const buildQueryString = (params: ListShiftsParams): string => {
  const query = new URLSearchParams();

  if (params.status !== undefined) query.set('status', params.status);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize));

  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

/**
 * Recurso "shifts" del SDK. Sigue el mismo patron que EmployeesResource.
 */
export class ShiftsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListShiftsParams = {}): Promise<ShiftsPage> {
    return this.http.request<ShiftsPage>(`/api/v1/shifts${buildQueryString(params)}`, { method: 'GET' });
  }

  get(shiftId: number): Promise<Shift> {
    return this.http.request<Shift>(`/api/v1/shifts/${shiftId}`, { method: 'GET' });
  }

  create(input: CreateShiftInput): Promise<Shift> {
    return this.http.request<Shift>('/api/v1/shifts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  update(shiftId: number, input: UpdateShiftInput): Promise<Shift> {
    return this.http.request<Shift>(`/api/v1/shifts/${shiftId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  /** Borrado logico: el backend hace status = 'inactive', nunca un DELETE real. */
  remove(shiftId: number): Promise<void> {
    return this.http.request<void>(`/api/v1/shifts/${shiftId}`, { method: 'DELETE' });
  }
}
