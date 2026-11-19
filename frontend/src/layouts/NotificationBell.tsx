import { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { MyNotifications, Notice } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { Icon } from '../components/atoms/Icon';
import { formatDaysHours } from '../utils/format';
import { queryClient } from '../services/query-client';
import { IconButton } from '../components/atoms/IconButton';
import { DropdownEmpty, DropdownItem, DropdownTitle } from '../components/molecules/DropdownPanel';

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
  const [open, setOpen] = useState(false);
  const { data: notifications = EMPTY, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => sdk.notifications.list({ signal }),
    refetchInterval: REFRESH_MS,
  });

  const changeOpen = (opening: boolean) => {
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
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <div id="notif-wrap" className="relative">
        <PopoverPrimitive.Trigger asChild>
          <IconButton id="notif-btn" title="Notificaciones" className="rounded-full">
            <Icon name="bell" />
          </IconButton>
        </PopoverPrimitive.Trigger>
      <span
        id="notif-badge"
        className="absolute top-1 right-1 size-2 rounded-full border-[1.5px] border-surface bg-[#ef4444]"
        hidden={notifications.unread === 0 && notifications.pending.total === 0}
      />
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          id="notif-dropdown"
          align="end"
          sideOffset={10}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="z-[60] max-h-[360px] w-80 overflow-y-auto rounded-md border border-line bg-surface shadow-md focus:outline-none"
        >
        <DropdownTitle>Notificaciones{count ? ` (${count})` : ''}</DropdownTitle>
        {notifications.pending.data.map((notice) => {
          const text = pendingText(notice);
          return (
            <DropdownItem
              key={`pending-${notice.notice_id}`}
              title={text.title}
              subtitle={text.sub}
              onClick={() => go(text.link)}
            />
          );
        })}
        {isEmpty ? (
          <DropdownEmpty>
            <Icon name="bell" />
            <br />
            No tienes notificaciones nuevas.
          </DropdownEmpty>
        ) : (
          notifications.data.map((item) => (
            <DropdownItem key={item.notification_id} title={item.title} subtitle={item.body} onClick={() => go(item.link)} />
          ))
        )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
