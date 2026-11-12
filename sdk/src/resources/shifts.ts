import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';

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
  active_employees: number;
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

export class ShiftsResource extends CrudResource<Shift, ListShiftsParams, CreateShiftInput, UpdateShiftInput> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/shifts');
  }

  replaceSchedule(shiftId: number, days: ShiftScheduleDay[]): Promise<Shift> {
    return this.http.request<Shift>(`${this.path}/${shiftId}/schedule`, { method: 'PUT', body: days });
  }
}
