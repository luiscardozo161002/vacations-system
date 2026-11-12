import { HttpClient } from '../core/http-client';
import { CallOptions, toQuery } from '../core/crud-resource';
import type { DaysAndHours, ListParams, Paginated } from '../types/common';

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

export interface ListNoticesParams extends ListParams {
  employee_id?: number;
  department_id?: number;
  reason_id?: number;
  kind?: NoticeKind;
  status?: NoticeStatus;
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
  remarks?: string | null;
}

export type UpdateNoticeInput = Partial<Omit<CreateNoticeInput, 'employee_id'>>;

export type PreviewNoticeInput = Omit<CreateNoticeInput, 'remarks'>;

export interface NoticePreview {
  breakdown: {
    days: number;
    hours: number;
    rest_days: number;
    daily_hours: number;
  } | null;
  affects_balance: boolean;
  balance: {
    entitlement_id: number;
    period_start: string;
    period_end: string;
    total_days: number;
    available: DaysAndHours;
    remaining: DaysAndHours;
  } | null;
  error: { code: string; message: string } | null;
}

const PATH = '/api/v1/notices';

export class NoticesResource {
  constructor(private readonly http: HttpClient) {}

  list(params?: ListNoticesParams, options: CallOptions = {}): Promise<Paginated<Notice>> {
    return this.http.request<Paginated<Notice>>(PATH, { method: 'GET', query: toQuery(params), signal: options.signal });
  }

  get(noticeId: number, options: CallOptions = {}): Promise<Notice> {
    return this.http.request<Notice>(`${PATH}/${noticeId}`, { method: 'GET', signal: options.signal });
  }

  preview(input: PreviewNoticeInput, options: CallOptions = {}): Promise<NoticePreview> {
    return this.http.request<NoticePreview>(`${PATH}/preview`, { method: 'POST', body: input, signal: options.signal });
  }

  create(input: CreateNoticeInput): Promise<Notice> {
    return this.http.request<Notice>(PATH, { method: 'POST', body: input });
  }

  update(noticeId: number, input: UpdateNoticeInput): Promise<Notice> {
    return this.http.request<Notice>(`${PATH}/${noticeId}`, { method: 'PATCH', body: input });
  }

  approve(noticeId: number): Promise<Notice> {
    return this.http.request<Notice>(`${PATH}/${noticeId}/approve`, { method: 'POST' });
  }

  reject(noticeId: number): Promise<Notice> {
    return this.http.request<Notice>(`${PATH}/${noticeId}/reject`, { method: 'POST' });
  }

  cancel(noticeId: number): Promise<Notice> {
    return this.http.request<Notice>(`${PATH}/${noticeId}/cancel`, { method: 'POST' });
  }
}
