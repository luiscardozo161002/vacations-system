import { HttpClient } from '../core/http-client';
import type { CallOptions } from '../core/crud-resource';
import type { Notice, NoticeKind, NoticeStatus } from './notices';
import type { VacationEntitlement } from './vacation-entitlements';

export interface UpcomingAbsence {
  notice_id: number;
  employee_name: string;
  department_name: string;
  reason_description: string;
  absence_start_date: string;
  absence_end_date: string;
  days_taken: number;
  hours_taken: number;
}

export interface DepartmentHeadcount {
  department_id: number;
  department_name: string;
  branch_code: string;
  active_employees: number;
}

export interface RecentActivity {
  notice_id: number;
  kind: NoticeKind;
  status: NoticeStatus;
  employee_name: string;
  reason_description: string;
  happened_at: string;
}

export interface TeamSummary {
  active_employees: number;
  absent_today: number;
  pending_requests: number;
  upcoming_vacations: number;
  upcoming_absences: UpcomingAbsence[];
  by_department: DepartmentHeadcount[];
  recent_activity: RecentActivity[];
}

export interface MyProfile {
  employee_id: number;
  employee_name: string;
  employee_number: string;
  start_date: string;
  department_name: string;
  shift_name: string;
  years_of_service: number;
}

export interface MySummary {
  profile: MyProfile;
  balance: VacationEntitlement | null;
  requests: Notice[];
  notices: Notice[];
}

export class DashboardResource {
  constructor(private readonly http: HttpClient) {}

  summary(options: CallOptions = {}): Promise<TeamSummary> {
    return this.http.request<TeamSummary>('/api/v1/dashboard/summary', { method: 'GET', signal: options.signal });
  }

  me(options: CallOptions = {}): Promise<MySummary> {
    return this.http.request<MySummary>('/api/v1/dashboard/me', { method: 'GET', signal: options.signal });
  }
}
