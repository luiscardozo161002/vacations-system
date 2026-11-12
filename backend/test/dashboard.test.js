require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';
const THH_HGO_DEPARTMENTS = ['Administracion', 'Explotacion', 'Fletes y Acarreos'];

let server;
const tokens = {};

const login = async (email) => {
  const res = await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: PASSWORD } });
  return res.result.accessToken;
};

before(async () => {
  server = await createServer();
  await server.initialize();
  tokens.SUPERUSER = await login('sysadmin@grupo-jo.com');
  tokens.USER = await login('r.jimenez@thh.com.mx');
  tokens.EMPLOYEE = await login('j.perez@jo.com.mx');
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const get = (role, url) => server.inject({ url: `/api/v1${url}`, headers: { authorization: `Bearer ${tokens[role]}` } });

describe('GET /dashboard/summary', () => {
  it('el Superusuario ve los indicadores de todas las sedes', async () => {
    const res = await get('SUPERUSER', '/dashboard/summary');

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.active_employees, 12);
    assert.equal(res.result.by_department.length, 8);
    assert.ok(res.result.upcoming_absences.length <= 4);
    assert.ok(res.result.recent_activity.length > 0);
  });

  it('RH solo cuenta lo de su sede y los pendientes cuadran con la lista', async () => {
    const res = await get('USER', '/dashboard/summary');
    const pending = await get('USER', '/notices?kind=request&status=pending');

    assert.equal(res.result.active_employees, 8);
    assert.deepEqual(
      res.result.by_department.map((department) => department.department_name),
      THH_HGO_DEPARTMENTS
    );
    assert.equal(res.result.pending_requests, pending.result.pagination.total);
    assert.ok(res.result.upcoming_absences.every((absence) => THH_HGO_DEPARTMENTS.includes(absence.department_name)));
  });

  it('el Empleado no ve el resumen del equipo', async () => {
    assert.equal((await get('EMPLOYEE', '/dashboard/summary')).statusCode, 403);
  });
});

describe('GET /dashboard/me', () => {
  it('el Empleado ve su perfil, su saldo y lo suyo', async () => {
    const res = await get('EMPLOYEE', '/dashboard/me');

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.profile.employee_name, 'Juan Perez Lopez');
    assert.equal(res.result.profile.shift_name, 'Operaciones');
    assert.equal(res.result.balance.total_days, 12);
    assert.ok(res.result.requests.every((request) => request.employee_id === 1 && request.kind === 'request'));
    assert.ok(res.result.notices.every((notice) => notice.employee_id === 1 && notice.kind === 'notice'));
  });

  it('un usuario de RH con empleado vinculado solo ve lo suyo', async () => {
    const res = await get('USER', '/dashboard/me');

    assert.equal(res.result.profile.employee_name, 'Roberto Jimenez Cruz');
    assert.ok(res.result.requests.every((request) => request.employee_id === 5));
  });

  it('sin empleado vinculado responde 404', async () => {
    const res = await get('SUPERUSER', '/dashboard/me');

    assert.equal(res.statusCode, 404);
    assert.equal(res.result.error.code, 'EMPLOYEE_NOT_FOUND');
  });
});
