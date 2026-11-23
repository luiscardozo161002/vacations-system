import { useLocation } from 'react-router';
import { cn } from '../utils/cn';
import { initial } from '../utils/format';
import { Avatar } from '../components/atoms/Avatar';
import { BrandMark } from '../components/atoms/BrandMark';
import { Icon } from '../components/atoms/Icon';
import { IconButton } from '../components/atoms/IconButton';
import { useAuth } from '../contexts/auth-context';
import { visibleGroups } from './navigation';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  displayName: string;
  roleLabel: string;
  onNavigate: (path: string) => void;
  onToggleCollapsed: () => void;
  onOpenProfile: () => void;
}

export function Sidebar({ collapsed, mobileOpen, displayName, roleLabel, onNavigate, onToggleCollapsed, onOpenProfile }: SidebarProps) {
  const { logout, can } = useAuth();
  const { pathname } = useLocation();

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'relative flex h-full w-[var(--sidebar-w)] shrink-0 flex-col border-r border-divider transition-[width] duration-[160ms] collapsed:w-[var(--sidebar-w-collapsed)]',
        'mobile:fixed mobile:top-0 mobile:left-0 mobile:z-50 mobile:h-screen mobile:-translate-x-full mobile:bg-surface mobile:shadow-md mobile:transition-transform mobile:duration-[180ms]',
        mobileOpen && 'mobile:translate-x-0',
      )}
    >
      <div className="flex h-[var(--topbar-h)] shrink-0 items-center gap-2 border-b border-divider px-4 collapsed:justify-center">
        <BrandMark />
        <span className="flex-1 truncate text-sm font-semibold collapsed:hidden">Vacation Manager</span>
      </div>

      <nav className="flex-1 overflow-x-hidden overflow-y-auto px-2.5 py-3">
        {visibleGroups(can).map((group) => (
          <div key={group.title} className="mb-[18px]">
            <div className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap text-muted uppercase collapsed:hidden">
              {group.title}
            </div>
            {group.items.map((item) => (
              <button
                key={item.path}
                type="button"
                title={item.label}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  'mb-0.5 flex w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-sm px-2.5 py-2 text-left text-[13.5px] font-medium whitespace-nowrap text-muted hover:bg-subtle hover:text-fg collapsed:mx-auto collapsed:mb-1 collapsed:size-10 collapsed:justify-center collapsed:rounded-full collapsed:p-0',
                  pathname === item.path && 'bg-primary text-primary-fg hover:bg-primary hover:text-primary-fg',
                )}
              >
                <Icon name={item.icon} />
                <span className="collapsed:hidden">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-1 border-t border-divider px-2.5 py-2 collapsed:justify-center">
        <button
          type="button"
          title="Editar perfil"
          onClick={onOpenProfile}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-sm p-1.5 text-left hover:bg-subtle"
        >
          <Avatar>{initial(displayName)}</Avatar>
          <div className="min-w-0 flex-1 collapsed:hidden">
            <div className="truncate text-[13px] font-semibold whitespace-nowrap">{displayName}</div>
            <div className="text-xs text-muted">{roleLabel}</div>
          </div>
        </button>
        <IconButton id="logout-btn" title="Cerrar sesión" onClick={logout} className="collapsed:hidden">
          <Icon name="log-out" />
        </IconButton>
      </div>

      <button
        type="button"
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        onClick={onToggleCollapsed}
        className="absolute top-1/2 -right-3.5 z-[15] inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted shadow-md transition-[background-color,color] duration-[120ms] hover:bg-subtle hover:text-fg active:scale-[0.92] mobile:hidden [&_svg]:transition-transform [&_svg]:duration-[160ms] collapsed:[&_svg]:rotate-180"
      >
        <Icon name="chevrons-left" />
      </button>
    </aside>
  );
}
