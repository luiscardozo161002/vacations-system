import { useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import { getTheme, subscribeTheme, toggleTheme } from '../utils/appearance';
import { Icon } from '../components/atoms/Icon';
import { IconButton } from '../components/atoms/IconButton';
import { useAuth } from '../contexts/auth-context';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { findNavItem } from './navigation';

interface TopbarProps {
  companyLabel?: string;
  onToggleMenu: () => void;
}

export function Topbar({ companyLabel, onToggleMenu }: TopbarProps) {
  const { can } = useAuth();
  const { pathname } = useLocation();
  const theme = useSyncExternalStore(subscribeTheme, getTheme);

  return (
    <header className="flex h-[var(--topbar-h)] shrink-0 items-center justify-between gap-4 border-b border-divider px-5">
      <div className="flex min-w-0 shrink items-center gap-2.5 overflow-hidden">
        <IconButton title="Mostrar menú" onClick={onToggleMenu} className="hidden mobile:inline-flex">
          <Icon name="menu" />
        </IconButton>
        <strong className="text-[13.5px] whitespace-nowrap">Sistema de Vacaciones</strong>
        <span className="text-line">/</span>
        <strong id="breadcrumb-current" className="truncate text-[13.5px] whitespace-nowrap text-fg">
          {findNavItem(pathname)?.title ?? 'Resumen'}
        </strong>
      </div>
      <div className="flex min-w-0 items-center gap-2.5">
        {can('employees:view') && <GlobalSearch />}
        {companyLabel && (
          <div
            id="company-select"
            className="hidden h-9 items-center gap-1.5 rounded-sm border border-line px-2.5 text-sm text-fg wide:flex [&_svg]:size-[15px]"
          >
            <Icon name="building-2" />
            <span id="company-select-name">{companyLabel}</span>
          </div>
        )}
        <IconButton id="theme-toggle-btn" title="Cambiar tema" onClick={toggleTheme} className="rounded-full">
          <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
        </IconButton>
        <NotificationBell />
      </div>
    </header>
  );
}
