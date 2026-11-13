import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { MyNotifications, Notice } from '@vacations/sdk';
import { sdk } from '../lib/sdk';
import { Icon } from '../components/Icon';
import { formatDaysHours } from '../lib/format';
import { queryClient } from '../lib/query-client';

const REFRESH_MS = 5 * 60 * 1000;
const QUERY_KEY = ['notifications'];

const EMPTY: MyNotifications = { data: [], unread: 0, pending: { total: 0, data: [] } };

const pendingText = (notice: Notice) =>
  notice.kind === 'request'
    ? {
        title: `Solicitud de ${notice.employee_name}`,
        sub: `${formatDaysHours(notice.days_taken, notice.hours_taken)} · pendiente de aprobación`,
        link: '/solicitudes',
      }
    : {
        title: `Aviso de ${notice.employee_name}`,
        sub: `${notice.reason_description} · pendiente de revisión`,
        link: '/avisos',
      };

export function NotificationBell() {
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { data: notifications = EMPTY, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => sdk.notifications.list({ signal }),
    refetchInterval: REFRESH_MS,
  });

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', closeOnOutsideClick);
    return () => document.removeEventListener('click', closeOnOutsideClick);
  }, [open]);

  const toggle = () => {
    const opening = !open;
    setOpen(opening);
    if (!opening) return;
    refetch().then(({ data }) => {
      if (!data?.unread) return;
      sdk.notifications
        .markAllRead()
        .then((read) =>
          queryClient.setQueryData<MyNotifications>(QUERY_KEY, (prev) => prev && { ...prev, unread: read.unread }),
        )
        .catch(() => undefined);
    });
  };

  const go = (link: string | null) => {
    setOpen(false);
    if (link) navigate(link);
  };

  const unreadShown = notifications.data.filter((item) => !item.read_at).length;
  const count = notifications.pending.total + unreadShown;
  const isEmpty = !notifications.data.length && !notifications.pending.data.length;

  return (
    <div className="notif-wrap" id="notif-wrap" ref={wrapRef}>
      <button type="button" className="icon-btn" id="notif-btn" title="Notificaciones" onClick={toggle}>
        <Icon name="bell" />
      </button>
      <span
        className="notif-badge"
        id="notif-badge"
        hidden={notifications.unread === 0 && notifications.pending.total === 0}
      />
      <div className="notif-dropdown" id="notif-dropdown" hidden={!open}>
        <div className="notif-dropdown-head">Notificaciones{count ? ` (${count})` : ''}</div>
        {notifications.pending.data.map((notice) => {
          const text = pendingText(notice);
          return (
            <div key={`pending-${notice.notice_id}`} className="notif-item" onClick={() => go(text.link)}>
              <span className="dot" />
              <div className="notif-text">
                {text.title}
                <div className="sub">{text.sub}</div>
              </div>
            </div>
          );
        })}
        {isEmpty ? (
          <div className="notif-empty">
            <Icon name="bell" />
            <br />
            No tienes notificaciones nuevas.
          </div>
        ) : (
          notifications.data.map((item) => (
            <div key={item.notification_id} className="notif-item" onClick={() => go(item.link)}>
              <span className="dot" />
              <div className="notif-text">
                {item.title}
                <div className="sub">{item.body}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
