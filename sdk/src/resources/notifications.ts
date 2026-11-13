import { HttpClient } from '../core/http-client';
import type { CallOptions } from '../core/crud-resource';
import type { Notice } from './notices';

export interface AppNotification {
  notification_id: number;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface MyNotifications {
  data: AppNotification[];
  unread: number;
  pending: {
    total: number;
    data: Notice[];
  };
}

const PATH = '/api/v1/me/notifications';

export class NotificationsResource {
  constructor(private readonly http: HttpClient) {}

  list(options: CallOptions = {}): Promise<MyNotifications> {
    return this.http.request<MyNotifications>(PATH, { method: 'GET', signal: options.signal });
  }

  markAllRead(): Promise<MyNotifications> {
    return this.http.request<MyNotifications>(`${PATH}/read`, { method: 'POST' });
  }
}
