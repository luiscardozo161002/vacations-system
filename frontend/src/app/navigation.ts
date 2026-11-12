export interface NavItem {
  path: string;
  label: string;
  title: string;
  icon: string;
  permission: string | null;
  ticket: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'General',
    items: [{ path: '/dashboard', label: 'Dashboard', title: 'Resumen', icon: 'home', permission: 'dashboard:view', ticket: 'VM-038' }],
  },
  {
    title: 'Gestión',
    items: [
      { path: '/empleados', label: 'Empleados', title: 'Empleados', icon: 'users', permission: 'employees:view', ticket: 'VM-033' },
      { path: '/solicitudes', label: 'Solicitudes', title: 'Solicitudes', icon: 'inbox', permission: 'requests:view', ticket: 'VM-034' },
      { path: '/calendario', label: 'Calendario', title: 'Calendario', icon: 'calendar', permission: 'calendar:view', ticket: 'VM-037' },
      { path: '/dias', label: 'Días', title: 'Días de vacaciones', icon: 'pie-chart', permission: 'balances:view', ticket: 'VM-036' },
      { path: '/avisos', label: 'Avisos', title: 'Avisos', icon: 'bell-ring', permission: 'notices:view', ticket: 'VM-035' },
    ],
  },
  {
    title: 'Organización',
    items: [
      { path: '/departamentos', label: 'Departamentos', title: 'Departamentos', icon: 'building-2', permission: 'departments:view', ticket: 'VM-042' },
      { path: '/empresas', label: 'Empresas', title: 'Empresas', icon: 'map-pin', permission: 'companies:view', ticket: 'VM-042' },
      { path: '/turnos', label: 'Turnos y horarios', title: 'Turnos y horarios', icon: 'clock', permission: 'shifts:view', ticket: 'VM-043' },
      { path: '/reglas', label: 'Reglas de acumulación', title: 'Reglas de acumulación', icon: 'sliders', permission: 'rules:view', ticket: 'VM-043' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { path: '/usuarios', label: 'Usuarios', title: 'Usuarios', icon: 'user-check', permission: 'users:view', ticket: 'VM-044' },
      { path: '/permisos', label: 'Roles y permisos', title: 'Roles y permisos', icon: 'shield', permission: 'permissions:view', ticket: 'VM-046' },
      { path: '/auditoria', label: 'Auditoría', title: 'Auditoría', icon: 'history', permission: 'audit:view', ticket: 'VM-046' },
    ],
  },
  {
    title: 'Sistema',
    items: [{ path: '/configuracion', label: 'Configuración', title: 'Configuración', icon: 'settings', permission: null, ticket: 'VM-045' }],
  },
];

export const ROLE_LABELS: Record<string, string> = {
  SUPERUSER: 'Superusuario',
  USER: 'Usuario',
  EMPLOYEE: 'Empleado',
};

export const visibleGroups = (can: (permission: string) => boolean): NavGroup[] =>
  NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.permission === null || can(item.permission)),
  })).filter((group) => group.items.length > 0);

export const findNavItem = (path: string): NavItem | undefined =>
  NAV_GROUPS.flatMap((group) => group.items).find((item) => item.path === path);
