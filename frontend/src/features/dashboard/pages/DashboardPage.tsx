import { useAuth } from '../../auth/auth-context';
import { EmployeeDashboard } from '../components/EmployeeDashboard';
import { TeamDashboard } from '../components/TeamDashboard';

export function DashboardPage() {
  const { user, can } = useAuth();

  if (!can('employees:view')) return <EmployeeDashboard />;

  const name = user?.employee?.employee_name ?? user?.username ?? '';
  return <TeamDashboard firstName={name.split(' ')[0]} allBranches={user?.role.role_code === 'SUPERUSER'} />;
}
