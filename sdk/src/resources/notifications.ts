import { ApiResource, CallOptions } from '../core/api-resource';
import type { HttpClient } from '../core/http-client';
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

export class NotificationsResource extends ApiResource {
  constructor(http: HttpClient) {
    super(http, '/me/notifications');
  }

  list(options: CallOptions = {}): Promise<MyNotifications> {
    return this.http.request<MyNotifications>(this.path, { signal: options.signal });
  }

  markAllRead(): Promise<MyNotifications> {
    return this.http.request<MyNotifications>(`${this.path}/read`, { method: 'POST' });
  }
}
