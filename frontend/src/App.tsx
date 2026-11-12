import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Shell } from './app/Shell';
import { PendingPage } from './app/PendingPage';
import { NAV_GROUPS, visibleGroups } from './app/navigation';
import { EmployeesPage } from './features/employees/pages/EmployeesPage';
import { RequestsPage } from './features/requests/pages/RequestsPage';
import { NoticesPage } from './features/requests/pages/NoticesPage';
import { BalancesPage } from './features/balances/pages/BalancesPage';
import { CalendarPage } from './features/calendar/pages/CalendarPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { DepartmentsPage } from './features/departments/pages/DepartmentsPage';
import { CompaniesPage } from './features/companies/pages/CompaniesPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { useAuth } from './features/auth/auth-context';

const PAGES: Record<string, ReactNode> = {
  '/dashboard': <DashboardPage />,
  '/empleados': <EmployeesPage />,
  '/solicitudes': <RequestsPage />,
  '/avisos': <NoticesPage />,
  '/dias': <BalancesPage />,
  '/calendario': <CalendarPage />,
  '/departamentos': <DepartmentsPage />,
  '/empresas': <CompaniesPage />,
  '/configuracion': <SettingsPage />,
};

function App() {
  const { status, can } = useAuth();

  if (status === 'loading') return null;
  if (status === 'anonymous') return <LoginPage />;

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
                  (PAGES[item.path] ?? <PendingPage item={item} />)
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
