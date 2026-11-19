import { useEffect, useState, useSyncExternalStore } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Icon } from '../components/atoms/Icon';
import { ToastProvider } from '../components/organisms/ToastProvider';
import { useAuth } from '../features/auth/auth-context';
import { ProfileDrawer } from '../features/auth/components/ProfileDrawer';
import { NotificationBell } from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';
import { config } from '../config';
import { initials } from '../utils/format';
import { getTheme, subscribeTheme, toggleTheme } from '../utils/appearance';
import { ROLE_LABELS, findNavItem, visibleGroups } from './navigation';
import { IconButton } from '../components/atoms/IconButton';
import { Avatar } from '../components/atoms/Avatar';

const COLLAPSED_KEY = 'vm_sidebar_collapsed';

export function Shell() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const theme = useSyncExternalStore(subscribeTheme, getTheme);

  const displayName = user?.employee?.employee_name ?? user?.username ?? '';
  const roleLabel = user ? (ROLE_LABELS[user.role.role_code] ?? user.role.description) : '';
  const branches = user?.role.role_code === config.roles.global ? [] : (user?.branches ?? []);
  const companyLabel =
    branches.length > 1 ? `${branches[0].company_name} · ${branches.length} sedes` : branches[0]?.company_name;

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const goTo = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div id="app-backdrop">
      <div id="app-shell">
        <ToastProvider>
          <div className={`sidebar-scrim${mobileOpen ? ' show' : ''}`} onClick={() => setMobileOpen(false)} />
          <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' open' : ''}`}>
            <div className="sidebar-brand">
              <div className="mark">
                <Icon name="calendar-check" />
              </div>
              <span className="brand-label">Vacation Manager</span>
            </div>

            <nav className="sidebar-nav">
              {visibleGroups(can).map((group) => (
                <div key={group.title} className="nav-group">
                  <div className="nav-group-title">{group.title}</div>
                  {group.items.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      className={`nav-item${pathname === item.path ? ' active' : ''}`}
                      title={item.label}
                      onClick={() => goTo(item.path)}
                    >
                      <span data-icon={item.icon}>
                        <Icon name={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            <div className="sidebar-user">
              <button type="button" className="sidebar-user-main" title="Editar perfil" onClick={() => setProfileOpen(true)}>
                <Avatar>{initials(displayName)}</Avatar>
                <div className="sidebar-user-info">
                  <div className="name">{displayName}</div>
                  <div className="role">{roleLabel}</div>
                </div>
              </button>
              <IconButton id="logout-btn" title="Cerrar sesión" onClick={logout}>
                <Icon name="log-out" />
              </IconButton>
            </div>

            <button
              type="button"
              className="sidebar-collapse-btn"
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
              onClick={() => setCollapsed((value) => !value)}
            >
              <Icon name="chevrons-left" />
            </button>
          </aside>

          <div className="main-col">
            <header className="topbar">
              <div className="topbar-left">
                <IconButton title="Mostrar menú" onClick={() => setMobileOpen((open) => !open)} className="menu-btn">
                  <Icon name="menu" />
                </IconButton>
                <strong className="brand-mini">Vacation Manager</strong>
                <span className="topbar-sep">/</span>
                <strong id="breadcrumb-current">{findNavItem(pathname)?.title ?? 'Resumen'}</strong>
              </div>
              <div className="topbar-right">
                {can('employees:view') && <GlobalSearch />}
                {companyLabel && (
                  <div className="company-select" id="company-select">
                    <span data-icon="building-2" style={{ width: 15, height: 15 }}>
                      <Icon name="building-2" />
                    </span>
                    <span id="company-select-name">{companyLabel}</span>
                  </div>
                )}
                <IconButton id="theme-toggle-btn" title="Cambiar tema" onClick={toggleTheme} className="rounded-full">
                  <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
                </IconButton>
                <NotificationBell />
              </div>
            </header>

            <main className="page-content">
              <Outlet />
            </main>
          </div>

          {profileOpen && user && (
            <ProfileDrawer user={user} roleLabel={roleLabel} onClose={() => setProfileOpen(false)} />
          )}
        </ToastProvider>
      </div>
    </div>
  );
}
