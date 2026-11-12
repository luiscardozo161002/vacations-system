require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';
const THH_HGO_EMPLOYEES = [1, 2, 3, 4, 5, 10, 11, 12];
const EXPLOTACION = 1;
const EXPLOTACION_EMPLOYEES = [1, 2, 10, 11];

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

const calendar = (role, from, to) =>
  server.inject({ url: `/api/v1/calendar?from=${from}&to=${to}`, headers: { authorization: `Bearer ${tokens[role]}` } });

const iso = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

describe('GET /calendar', () => {
  it('trae los festivos del rango', async () => {
    const res = await calendar('EMPLOYEE', '2026-09-01', '2026-09-30');

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.result.holidays, [{ date: '2026-09-16', name: 'Día de la Independencia' }]);
  });

  it('el Superusuario ve las ausencias aprobadas y pendientes de todos', async () => {
    const res = await calendar('SUPERUSER', iso(-45), iso(10));
    const statuses = new Set(res.result.absences.map((absence) => absence.status));

    assert.ok(res.result.absences.length >= 8);
    assert.ok([...statuses].every((status) => ['approved', 'pending'].includes(status)));
    assert.ok(res.result.absences[0].employee_name);
  });

  it('RH solo ve ausencias de su sede', async () => {
    const hr = await calendar('USER', iso(-45), iso(10));

    assert.ok(hr.result.absences.every((absence) => THH_HGO_EMPLOYEES.includes(absence.employee_id)));
  });

  it('el Empleado ve lo suyo y lo de su departamento solo si el departamento lo comparte', async () => {
    const shared = await calendar('EMPLOYEE', iso(-45), iso(10));
    const ids = new Set(shared.result.absences.map((absence) => absence.employee_id));

    assert.ok(ids.has(1));
    assert.ok([...ids].some((id) => id !== 1));
    assert.ok([...ids].every((id) => EXPLOTACION_EMPLOYEES.includes(id)));

    await db('departments').where({ department_id: EXPLOTACION }).update({ calendar_shared: false });
    const hidden = await calendar('EMPLOYEE', iso(-45), iso(10));
    await db('departments').where({ department_id: EXPLOTACION }).update({ calendar_shared: true });

    assert.ok(hidden.result.absences.every((absence) => absence.employee_id === 1));
  });

  it('rechaza rangos invertidos o de más de 62 días', async () => {
    assert.equal((await calendar('EMPLOYEE', '2026-09-30', '2026-09-01')).result.error.code, 'INVALID_RANGE');
    assert.equal((await calendar('EMPLOYEE', '2026-01-01', '2026-06-30')).result.error.code, 'RANGE_TOO_LONG');
  });
});
