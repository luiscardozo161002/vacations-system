import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { cn } from '../utils/cn';
import { config } from '../config';
import { Toaster } from '../components/organisms/Toaster';
import { useAuth } from '../features/auth/auth-context';
import { ProfileDrawer } from '../features/auth/components/ProfileDrawer';
import { ROLE_LABELS } from './navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const COLLAPSED_KEY = 'vm_sidebar_collapsed';

export function Shell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    <div id="app-backdrop" className="flex min-h-screen bg-backdrop p-[var(--window-margin)] mobile:p-0">
      <div
        id="app-shell"
        className="relative flex h-[calc(100vh-var(--window-margin)*2)] w-full overflow-hidden rounded-[var(--window-radius)] border border-line bg-[var(--surface)] shadow-[0_24px_60px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.06)] [--surface:rgba(var(--window-bg-rgb,255,255,255),var(--window-bg-alpha,1))] mobile:h-screen mobile:rounded-none mobile:border-0 mobile:shadow-none"
      >
        <>
          <div
            className={cn('fixed inset-0 z-[45] hidden bg-[rgba(15,23,42,0.35)]', mobileOpen && 'mobile:block')}
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            displayName={displayName}
            roleLabel={roleLabel}
            onNavigate={goTo}
            onToggleCollapsed={() => setCollapsed((value) => !value)}
            onOpenProfile={() => setProfileOpen(true)}
          />

          <div className="flex h-full min-w-0 flex-1 flex-col">
            <Topbar companyLabel={companyLabel} onToggleMenu={() => setMobileOpen((open) => !open)} />
            <main className="mx-auto min-h-0 w-full max-w-[1280px] flex-1 overflow-y-auto p-6 mobile:p-4">
              <Outlet />
            </main>
          </div>

          {profileOpen && user && (
            <ProfileDrawer user={user} roleLabel={roleLabel} onClose={() => setProfileOpen(false)} />
          )}
          <Toaster />
        </>
      </div>
    </div>
  );
}
