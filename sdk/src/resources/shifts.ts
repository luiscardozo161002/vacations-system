import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ListParams, RecordStatus } from '../types/common';

export type ShiftStatus = RecordStatus;

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
  status: RecordStatus;
  created_at: string;
  updated_at: string;
  schedule: ShiftScheduleDay[];
  active_employees: number;
}

export interface ListShiftsParams extends ListParams {
  status?: RecordStatus;
}

export interface CreateShiftInput {
  code: string;
  shift_name: string;
  number_days: number;
  status?: RecordStatus;
}

export type UpdateShiftInput = Partial<CreateShiftInput>;

export class ShiftsResource extends CrudResource<Shift, ListShiftsParams, CreateShiftInput, UpdateShiftInput> {
  constructor(http: HttpClient) {
    super(http, '/shifts');
  }

  replaceSchedule(shiftId: number, days: ShiftScheduleDay[]): Promise<Shift> {
    return this.http.request<Shift>(`${this.path}/${shiftId}/schedule`, { method: 'PUT', body: days });
  }
}
