import { HttpClient } from '../core/http-client';
import type { Paginated } from '../types/common';

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
  sort?: string;
  page?: number;
  pageSize?: number;
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

export class ShiftsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListShiftsParams = {}, options: { signal?: AbortSignal } = {}): Promise<Paginated<Shift>> {
    return this.http.request<Paginated<Shift>>('/api/v1/shifts', {
      method: 'GET',
      query: { ...params },
      signal: options.signal,
    });
  }

  get(shiftId: number, options: { signal?: AbortSignal } = {}): Promise<Shift> {
    return this.http.request<Shift>(`/api/v1/shifts/${shiftId}`, { method: 'GET', signal: options.signal });
  }

  create(input: CreateShiftInput): Promise<Shift> {
    return this.http.request<Shift>('/api/v1/shifts', { method: 'POST', body: input });
  }

  update(shiftId: number, input: UpdateShiftInput): Promise<Shift> {
    return this.http.request<Shift>(`/api/v1/shifts/${shiftId}`, { method: 'PATCH', body: input });
  }

  remove(shiftId: number): Promise<void> {
    return this.http.request<void>(`/api/v1/shifts/${shiftId}`, { method: 'DELETE' });
  }
}
