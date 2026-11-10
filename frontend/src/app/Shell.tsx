import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Icon } from '../components/Icon';
import { useAuth } from '../features/auth/auth-context';
import { initials } from '../lib/format';
import { getTheme, toggleTheme } from '../lib/theme';
import { ROLE_LABELS, findNavItem, visibleGroups } from './navigation';

const COLLAPSED_KEY = 'vm_sidebar_collapsed';

export function Shell() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme);

  const displayName = user?.employee?.employee_name ?? user?.username ?? '';
  const roleLabel = user ? (ROLE_LABELS[user.role.role_code] ?? user.role.description) : '';

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
            <button type="button" className="sidebar-user-main" title="Editar perfil">
              <div className="avatar">{initials(displayName)}</div>
              <div className="sidebar-user-info">
                <div className="name">{displayName}</div>
                <div className="role">{roleLabel}</div>
              </div>
            </button>
            <button type="button" className="icon-btn" id="logout-btn" title="Cerrar sesión" onClick={logout}>
              <Icon name="log-out" />
            </button>
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
              <button
                type="button"
                className="icon-btn menu-btn"
                title="Mostrar menú"
                onClick={() => setMobileOpen((open) => !open)}
              >
                <Icon name="menu" />
              </button>
              <strong className="brand-mini">Vacation Manager</strong>
              <span className="topbar-sep">/</span>
              <strong id="breadcrumb-current">{findNavItem(pathname)?.title ?? 'Resumen'}</strong>
            </div>
            <div className="topbar-right">
              <button
                type="button"
                className="icon-btn"
                id="theme-toggle-btn"
                title="Cambiar tema"
                onClick={() => setTheme(toggleTheme())}
              >
                <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
              </button>
            </div>
          </header>

          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
