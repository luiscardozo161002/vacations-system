import { HttpClient } from '../core/http-client';
import type { Paginated } from '../types/common';

export type ShiftStatus = 'active' | 'inactive';

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ShiftScheduleDay {
  day_of_week: DayOfWeek;
  is_working_day: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
}

export interface Shift {
  shift_id: number;
  code: string;
  shift_name: string;
  number_days: number;
  status: ShiftStatus;
  created_at: string;
  updated_at: string;
  schedule: ShiftScheduleDay[];
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

  replaceSchedule(shiftId: number, days: ShiftScheduleDay[]): Promise<Shift> {
    return this.http.request<Shift>(`/api/v1/shifts/${shiftId}/schedule`, { method: 'PUT', body: days });
  }

  update(shiftId: number, input: UpdateShiftInput): Promise<Shift> {
    return this.http.request<Shift>(`/api/v1/shifts/${shiftId}`, { method: 'PATCH', body: input });
  }

  remove(shiftId: number): Promise<void> {
    return this.http.request<void>(`/api/v1/shifts/${shiftId}`, { method: 'DELETE' });
  }
}
