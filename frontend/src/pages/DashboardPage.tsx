import { config } from '../config';
import { useAuth } from '../contexts/auth-context';
import { EmployeeDashboard } from '../features/dashboard/components/EmployeeDashboard';
import { TeamDashboard } from '../features/dashboard/components/TeamDashboard';

export function DashboardPage() {
  const { user, can } = useAuth();

  if (!can('employees:view')) return <EmployeeDashboard />;

  const name = user?.employee?.employee_name ?? user?.username ?? '';
  return <TeamDashboard firstName={name.split(' ')[0]} allBranches={user?.role.role_code === config.roles.global} />;
}
