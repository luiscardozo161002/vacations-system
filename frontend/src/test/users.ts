import type { CurrentUser } from '@vacations/sdk';

const EMPLOYEE_PERMISSIONS = [
  'dashboard:view',
  'requests:view',
  'requests:create',
  'notices:view',
  'calendar:view',
  'balances:view',
  'reasons:view',
];

const HR_PERMISSIONS = [
  'dashboard:view',
  'employees:view',
  'employees:create',
  'employees:update',
  'requests:view',
  'approvals:review',
  'notices:view',
  'notices:create',
  'calendar:view',
  'balances:view',
  'departments:view',
  'companies:view',
  'shifts:view',
  'rules:view',
  'reasons:view',
];

const baseUser = {
  status: 'active' as const,
  last_login_at: null,
  must_change_password: false,
  temporary_password_expires_at: null,
  branches: [],
};

export const employeeUser: CurrentUser = {
  ...baseUser,
  user_id: 4,
  username: 'j.perez',
  email: 'j.perez@jo.com.mx',
  review_actions: [],
  role: { role_id: 3, role_code: 'EMPLOYEE', description: 'Empleado' },
  employee: { employee_id: 1, employee_number: 'EMP-001', employee_name: 'Juan Perez Lopez', department_id: 1, shift_id: 2 },
  permissions: EMPLOYEE_PERMISSIONS,
};

export const hrUser: CurrentUser = {
  ...baseUser,
  user_id: 2,
  username: 'r.jimenez',
  email: 'r.jimenez@thh.com.mx',
  review_actions: ['approve', 'reject', 'cancel'],
  role: { role_id: 2, role_code: 'USER', description: 'Usuario' },
  employee: null,
  permissions: HR_PERMISSIONS,
};
