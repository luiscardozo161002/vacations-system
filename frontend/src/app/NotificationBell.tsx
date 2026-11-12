import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { MyNotifications } from '@vacations/sdk';
import { sdk } from '../lib/sdk';
import { Icon } from '../components/Icon';

const REFRESH_MS = 5 * 60 * 1000;

export function NotificationBell() {
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<MyNotifications>({ data: [], unread: 0 });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = () =>
      sdk.notifications
        .list()
        .then(setNotifications)
        .catch(() => undefined);
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

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
    if (opening && notifications.unread > 0) {
      sdk.notifications
        .markAllRead()
        .then((result) => setNotifications((prev) => ({ data: prev.data, unread: result.unread })))
        .catch(() => undefined);
    }
  };

  const go = (link: string | null) => {
    setOpen(false);
    if (link) navigate(link);
  };

  const unreadShown = notifications.data.filter((item) => !item.read_at).length;

  return (
    <div className="notif-wrap" id="notif-wrap" ref={wrapRef}>
      <button type="button" className="icon-btn" id="notif-btn" title="Notificaciones" onClick={toggle}>
        <Icon name="bell" />
      </button>
      <span className="notif-badge" id="notif-badge" hidden={notifications.unread === 0} />
      <div className="notif-dropdown" id="notif-dropdown" hidden={!open}>
        <div className="notif-dropdown-head">Notificaciones{unreadShown ? ` (${unreadShown})` : ''}</div>
        {notifications.data.length ? (
          notifications.data.map((item) => (
            <div key={item.notification_id} className="notif-item" onClick={() => go(item.link)}>
              <span className="dot" />
              <div className="notif-text">
                {item.title}
                <div className="sub">{item.body}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="notif-empty">
            <Icon name="bell" />
            <br />
            No tienes notificaciones nuevas.
          </div>
        )}
      </div>
    </div>
  );
}
