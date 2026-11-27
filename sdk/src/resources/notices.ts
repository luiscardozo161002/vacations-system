import type { CallOptions } from '../core/api-resource';
import { ReadResource } from '../core/crud-resource';
import type { HttpClient } from '../core/http-client';
import type { DaysAndHours, EmployeeFilterParams, ListParams, OneOrMany } from '../types/common';

export type NoticeKind = 'request' | 'notice';

export type NoticeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Notice {
  notice_id: number;
  employee_id: number;
  kind: NoticeKind;
  status: NoticeStatus;
  reason_id: number;
  absence_start_date: string;
  absence_end_date: string;
  absence_start_time: string | null;
  absence_end_time: string | null;
  skip_saturdays: boolean;
  remarks: string | null;
  days_taken: number;
  hours_taken: number;
  entitlement_id: number | null;
  created_by: number | null;
  approved_by: number | null;
  approved_at: string | null;
  request_date: string;
  employee_name: string | null;
  employee_number: string | null;
  department_name: string | null;
  reason_description: string | null;
}

export interface ListNoticesParams extends ListParams, EmployeeFilterParams {
  employee_id?: OneOrMany<number>;
  reason_id?: OneOrMany<number>;
  kind?: OneOrMany<NoticeKind>;
  status?: OneOrMany<NoticeStatus>;
  from?: string;
  to?: string;
}

export interface CreateNoticeInput {
  employee_id: number;
  reason_id: number;
  absence_start_date: string;
  absence_end_date: string;
  absence_start_time?: string | null;
  absence_end_time?: string | null;
  skip_saturdays?: boolean;
  remarks?: string | null;
}

export type UpdateNoticeInput = Partial<Omit<CreateNoticeInput, 'employee_id'>>;

export type PreviewNoticeInput = Omit<CreateNoticeInput, 'remarks'> & { ignore_notice_id?: number };

export interface WorkHours {
  start: string;
  end: string;
}

export interface NoticePreview {
  work_hours: WorkHours | null;
  busy_hours: WorkHours[];
  working_weekdays: number[];
  breakdown: {
    days: number;
    hours: number;
    rest_days: number;
    holidays: number;
    daily_hours: number;
  } | null;
  affects_balance: boolean;
  balance: {
    entitlement_id: number;
    period_start: string;
    period_end: string;
    total_days: number;
    used: DaysAndHours;
    available: DaysAndHours;
    remaining: DaysAndHours;
  } | null;
  error: { code: string; message: string } | null;
}

export class NoticesResource extends ReadResource<Notice, ListNoticesParams> {
  constructor(http: HttpClient) {
    super(http, '/notices');
  }

  create(input: CreateNoticeInput): Promise<Notice> {
    return this.http.request<Notice>(this.path, { method: 'POST', body: input });
  }

  update(noticeId: number, input: UpdateNoticeInput): Promise<Notice> {
    return this.http.request<Notice>(`${this.path}/${noticeId}`, { method: 'PATCH', body: input });
  }

  preview(input: PreviewNoticeInput, options: CallOptions = {}): Promise<NoticePreview> {
    return this.http.request<NoticePreview>(`${this.path}/preview`, { method: 'POST', body: input, signal: options.signal });
  }

  pdf(noticeId: number): Promise<Blob> {
    return this.http.requestBlob(`${this.path}/${noticeId}/pdf`);
  }

  approve(noticeId: number): Promise<Notice> {
    return this.http.request<Notice>(`${this.path}/${noticeId}/approve`, { method: 'POST' });
  }

  reject(noticeId: number): Promise<Notice> {
    return this.http.request<Notice>(`${this.path}/${noticeId}/reject`, { method: 'POST' });
  }

  cancel(noticeId: number): Promise<Notice> {
    return this.http.request<Notice>(`${this.path}/${noticeId}/cancel`, { method: 'POST' });
  }
}
