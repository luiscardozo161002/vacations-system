import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Shell } from './layouts/Shell';
import { NAV_GROUPS, visibleGroups } from './layouts/navigation';
import { EmployeesPage } from './pages/EmployeesPage';
import { RequestsPage } from './pages/RequestsPage';
import { NoticesPage } from './pages/NoticesPage';
import { BalancesPage } from './pages/BalancesPage';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { RulesPage } from './pages/RulesPage';
import { UsersPage } from './pages/UsersPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { useAuth } from './contexts/auth-context';

const PAGES: Record<string, ReactNode> = {
  '/dashboard': <DashboardPage />,
  '/empleados': <EmployeesPage />,
  '/solicitudes': <RequestsPage />,
  '/avisos': <NoticesPage />,
  '/dias': <BalancesPage />,
  '/calendario': <CalendarPage />,
  '/departamentos': <DepartmentsPage />,
  '/empresas': <CompaniesPage />,
  '/turnos': <ShiftsPage />,
  '/reglas': <RulesPage />,
  '/usuarios': <UsersPage />,
  '/permisos': <PermissionsPage />,
  '/auditoria': <AuditPage />,
  '/configuracion': <SettingsPage />,
};

function App() {
  const { status, user, can } = useAuth();

  if (status === 'loading') return null;
  if (status === 'anonymous') return <LoginPage />;
  if (user?.must_change_password) return <ChangePasswordPage />;

  const firstAllowed = visibleGroups(can)[0]?.items[0]?.path ?? '/dashboard';

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          {NAV_GROUPS.flatMap((group) => group.items).map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                item.permission === null || can(item.permission) ? (
                  PAGES[item.path]
                ) : (
                  <Navigate to={firstAllowed} replace />
                )
              }
            />
          ))}
          <Route path="*" element={<Navigate to={firstAllowed} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
