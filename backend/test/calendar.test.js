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
  it('marca solo los días que el empleado trabaja según su turno', async () => {
    const res = await calendar('SUPERUSER', '2026-10-01', '2026-10-31');
    const byStart = (date) => res.result.absences.find((absence) => absence.absence_start_date === date);

    assert.deepEqual(byStart('2026-10-04').dates, [
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-12',
      '2026-10-13',
    ]);
    assert.deepEqual(byStart('2026-10-24').dates, ['2026-10-24', '2026-10-26', '2026-10-27', '2026-10-28']);
  });

  it('no marca los festivos ni ausencias que caen solo en descanso', async () => {
    const [holiday, weekend] = await db('notices')
      .insert([
        { employee_id: 2, reason_id: 1, kind: 'request', status: 'pending', absence_start_date: '2026-09-15', absence_end_date: '2026-09-17' },
        { employee_id: 5, reason_id: 1, kind: 'request', status: 'pending', absence_start_date: '2026-09-19', absence_end_date: '2026-09-20' },
      ])
      .returning('notice_id');

    const res = await calendar('SUPERUSER', '2026-09-01', '2026-09-30');
    await db('notices').whereIn('notice_id', [holiday.notice_id, weekend.notice_id]).del();
    const find = (id) => res.result.absences.find((absence) => absence.notice_id === id);

    assert.deepEqual(find(holiday.notice_id).dates, ['2026-09-15', '2026-09-17']);
    assert.equal(find(weekend.notice_id), undefined);
  });

  it('trae los festivos del rango', async () => {
    const res = await calendar('EMPLOYEE', '2026-09-01', '2026-09-30');

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.result.holidays, [{ date: '2026-09-16', name: 'Día de la Independencia' }]);
  });

  it('el Superusuario ve las ausencias aprobadas y pendientes de todos', async () => {
    const res = await calendar('SUPERUSER', iso(-45), iso(10));
    const statuses = new Set(res.result.absences.map((absence) => absence.status));

    assert.ok(res.result.absences.length >= 7);
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
