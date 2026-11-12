const ROLES = [
  { old: 'ADMIN', code: 'SUPERUSER', description: 'Superusuario' },
  { old: 'HR', code: 'USER', description: 'Usuario de Recursos Humanos' },
  { old: 'EMPLOYEE', code: 'EMPLOYEE', description: 'Empleado' },
];

const PERMISSIONS = {
  'dashboard:view': 'Ver el dashboard',
  'employees:view': 'Ver empleados',
  'employees:create': 'Dar de alta empleados',
  'employees:update': 'Editar empleados',
  'employees:delete': 'Dar de baja empleados',
  'requests:view': 'Ver solicitudes',
  'requests:create': 'Crear solicitudes',
  'requests:update': 'Editar solicitudes',
  'requests:delete': 'Eliminar solicitudes',
  'approvals:review': 'Aprobar, rechazar o cancelar solicitudes',
  'notices:view': 'Ver avisos',
  'notices:create': 'Registrar avisos',
  'notices:update': 'Editar avisos',
  'calendar:view': 'Ver el calendario',
  'balances:view': 'Ver saldos de vacaciones',
  'balances:update': 'Editar saldos de vacaciones',
  'departments:view': 'Ver departamentos',
  'departments:create': 'Crear departamentos',
  'departments:update': 'Editar departamentos',
  'departments:delete': 'Dar de baja departamentos',
  'companies:view': 'Ver empresas',
  'companies:create': 'Crear empresas',
  'companies:update': 'Editar empresas',
  'companies:delete': 'Dar de baja empresas',
  'shifts:view': 'Ver turnos',
  'shifts:create': 'Crear turnos',
  'shifts:update': 'Editar turnos',
  'shifts:delete': 'Dar de baja turnos',
  'rules:view': 'Ver reglas de acumulación',
  'rules:create': 'Crear reglas de acumulación',
  'rules:update': 'Editar reglas de acumulación',
  'rules:delete': 'Dar de baja reglas de acumulación',
  'reasons:view': 'Ver motivos',
  'reasons:create': 'Crear motivos',
  'reasons:update': 'Editar motivos',
  'reasons:delete': 'Dar de baja motivos',
  'users:view': 'Ver usuarios',
  'users:create': 'Crear usuarios',
  'users:update': 'Editar usuarios',
  'users:delete': 'Desactivar usuarios',
  'permissions:view': 'Ver roles y permisos',
  'permissions:update': 'Editar roles y permisos',
  'audit:view': 'Ver la auditoría',
};

const GRANTS = {
  SUPERUSER: Object.keys(PERMISSIONS),
  USER: [
    'dashboard:view',
    'employees:view',
    'employees:create',
    'employees:update',
    'employees:delete',
    'requests:view',
    'requests:update',
    'approvals:review',
    'notices:view',
    'notices:create',
    'notices:update',
    'calendar:view',
    'balances:view',
    'balances:update',
    'departments:view',
    'departments:update',
    'companies:view',
    'shifts:view',
    'shifts:update',
    'rules:view',
    'rules:update',
    'reasons:view',
  ],
  EMPLOYEE: ['dashboard:view', 'requests:view', 'requests:create', 'notices:view', 'calendar:view', 'balances:view', 'reasons:view'],
};

const LEGACY_PERMISSIONS = {
  NOTICE_CREATE: 'Crear avisos de ausencia propios',
  NOTICE_READ_OWN: 'Ver los avisos propios y el saldo propio',
  NOTICE_READ_ALL: 'Ver avisos de todos los empleados',
  NOTICE_APPROVE: 'Aprobar o rechazar avisos',
  EMPLOYEE_MANAGE: 'Administrar el catalogo de empleados',
  REPORT_VIEW: 'Ver reportes de vacaciones y ausencias',
  USER_MANAGE: 'Administrar usuarios, roles y permisos',
};

const LEGACY_GRANTS = {
  ADMIN: Object.keys(LEGACY_PERMISSIONS),
  HR: ['NOTICE_CREATE', 'NOTICE_READ_OWN', 'NOTICE_READ_ALL', 'NOTICE_APPROVE', 'EMPLOYEE_MANAGE', 'REPORT_VIEW'],
  EMPLOYEE: ['NOTICE_CREATE', 'NOTICE_READ_OWN'],
};

const replacePermissions = async (knex, permissions, grants) => {
  await knex('role_permissions').del();
  await knex('permissions').del();

  await knex('permissions').insert(
    Object.entries(permissions).map(([permission_code, description]) => ({ permission_code, description }))
  );

  const roleIds = Object.fromEntries((await knex('roles').select('role_id', 'role_code')).map((r) => [r.role_code, r.role_id]));
  const permissionIds = Object.fromEntries(
    (await knex('permissions').select('permission_id', 'permission_code')).map((p) => [p.permission_code, p.permission_id])
  );

  await knex('role_permissions').insert(
    Object.entries(grants).flatMap(([roleCode, codes]) =>
      codes.map((code) => ({ role_id: roleIds[roleCode], permission_id: permissionIds[code] }))
    )
  );
};

exports.up = async function (knex) {
  for (const role of ROLES) {
    await knex('roles').where({ role_code: role.old }).update({ role_code: role.code, description: role.description });
  }
  await knex('roles')
    .insert(ROLES.map(({ code, description }) => ({ role_code: code, description })))
    .onConflict('role_code')
    .ignore();

  await replacePermissions(knex, PERMISSIONS, GRANTS);
};

exports.down = async function (knex) {
  for (const role of ROLES) {
    await knex('roles').where({ role_code: role.code }).update({ role_code: role.old });
  }
  await knex('roles').where({ role_code: 'ADMIN' }).update({ description: 'Administrador del sistema' });
  await knex('roles').where({ role_code: 'HR' }).update({ description: 'Recursos humanos / aprobador de avisos' });

  await replacePermissions(knex, LEGACY_PERMISSIONS, LEGACY_GRANTS);
};
