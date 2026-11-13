import { HttpClient } from '../core/http-client';
import type { CallOptions } from '../core/crud-resource';
import type { NoticeKind, NoticeStatus } from './notices';

export interface Holiday {
  date: string;
  name: string;
}

export interface CalendarAbsence {
  notice_id: number;
  employee_id: number;
  employee_name: string;
  department_name: string;
  reason_description: string;
  kind: NoticeKind;
  status: Extract<NoticeStatus, 'approved' | 'pending'>;
  absence_start_date: string;
  absence_end_date: string;
  absence_start_time: string | null;
  absence_end_time: string | null;
  dates: string[];
}

export interface CalendarRange {
  from: string;
  to: string;
}

export interface Calendar extends CalendarRange {
  holidays: Holiday[];
  absences: CalendarAbsence[];
}

export class CalendarResource {
  constructor(private readonly http: HttpClient) {}

  get(range: CalendarRange, options: CallOptions = {}): Promise<Calendar> {
    return this.http.request<Calendar>('/api/v1/calendar', { method: 'GET', query: { ...range }, signal: options.signal });
  }
}
