require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Jwt = require('@hapi/jwt');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';

const ACCOUNTS = {
  SUPERUSER: 'sysadmin@grupo-jo.com',
  USER: 'r.jimenez@thh.com.mx',
  EMPLOYEE: 'j.perez@jo.com.mx',
};

let server;
const tokens = {};

before(async () => {
  server = await createServer();
  await server.initialize();
  for (const [role, email] of Object.entries(ACCOUNTS)) {
    const res = await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: PASSWORD } });
    tokens[role] = res.result.accessToken;
  }
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const call = (role, method, url) =>
  server.inject({ method, url: `/api/v1${url}`, headers: { authorization: `Bearer ${tokens[role]}` } });

describe('RBAC', () => {
  it('el token lleva los permisos del rol en scope', () => {
    const { scope } = Jwt.token.decode(tokens.EMPLOYEE).decoded.payload;

    assert.ok(scope.includes('requests:create'));
    assert.ok(!scope.includes('employees:view'));
  });

  it('el Superusuario entra a usuarios y auditoría', async () => {
    assert.equal((await call('SUPERUSER', 'GET', '/users')).statusCode, 200);
    assert.equal((await call('SUPERUSER', 'GET', '/auth-audit-log')).statusCode, 200);
  });

  it('el Usuario ve empleados pero no usuarios', async () => {
    assert.equal((await call('USER', 'GET', '/employees')).statusCode, 200);

    const res = await call('USER', 'GET', '/users');
    assert.equal(res.statusCode, 403);
    assert.equal(res.result.error.code, 'FORBIDDEN');
  });

  it('el Usuario no crea empresas ni edita permisos', async () => {
    assert.equal((await call('USER', 'POST', '/companies')).statusCode, 403);
    assert.equal((await call('USER', 'DELETE', '/role-permissions/1/1')).statusCode, 403);
  });

  it('el Empleado ve solicitudes pero no empleados', async () => {
    assert.equal((await call('EMPLOYEE', 'GET', '/notices')).statusCode, 200);
    assert.equal((await call('EMPLOYEE', 'GET', '/employees')).statusCode, 403);
  });

  it('el Empleado no da de baja empleados ni edita saldos', async () => {
    assert.equal((await call('EMPLOYEE', 'DELETE', '/employees/1')).statusCode, 403);
    assert.equal((await call('EMPLOYEE', 'PATCH', '/vacation-entitlements/1')).statusCode, 403);
  });

  it('/auth/me no exige permisos y devuelve los nuevos códigos', async () => {
    const res = await call('EMPLOYEE', 'GET', '/auth/me');

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.role.role_code, 'EMPLOYEE');
    assert.ok(res.result.permissions.includes('calendar:view'));
  });
});
