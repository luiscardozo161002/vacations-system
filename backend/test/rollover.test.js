require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');
const { addDays } = require('../src/lib/periods');

const PASSWORD = 'Vacaciones2026!';
const JUAN = 1;
const NEW_HIRE = 10;
const VACATION = 5;

let server;
const tokens = {};
let periodEnd;

const login = async (email) => {
  const res = await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: PASSWORD } });
  return res.result.accessToken;
};

before(async () => {
  await db.seed.run();
  server = await createServer();
  await server.initialize();
  tokens.SUPERUSER = await login('sysadmin@grupo-jo.com');
  tokens.USER = await login('r.jimenez@thh.com.mx');
  tokens.EMPLOYEE = await login('j.perez@jo.com.mx');
  periodEnd = (await db('vacation_entitlements').where({ employee_id: JUAN, status: 'active' }).first('period_end')).period_end;
});

after(async () => {
  await db.seed.run();
  await server.stop();
  await db.destroy();
});

const call = (role, method, url, payload) =>
  server.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${tokens[role]}` } });

const generate = async (date) => (await call('SUPERUSER', 'POST', '/vacation-entitlements/generate', date ? { date } : undefined)).result;

const juanNotifications = (kind) => db('notifications').where({ user_id: 4, kind }).select('title', 'body');

describe('POST /vacation-entitlements/generate', () => {
  it('solo el Superusuario lo corre', async () => {
    assert.equal((await call('USER', 'POST', '/vacation-entitlements/generate')).statusCode, 403);
  });

  it('hoy no cambia nada si los periodos ya existen y es idempotente', async () => {
    const first = await generate();
    const second = await generate();

    assert.ok(first.skipped.some((skip) => skip.employee_id === NEW_HIRE && skip.reason === 'Aún no cumple un año de antigüedad'));
    assert.deepEqual([second.created, second.expired, second.reminders], [0, 0, 0]);
  });

  it('una semana antes del aniversario avisa los días que quedan, una sola vez', async () => {
    const reminderDay = addDays(periodEnd, -6);
    const first = await generate(reminderDay);
    await generate(reminderDay);

    const reminders = await juanNotifications('period_expiring');
    assert.ok(first.reminders >= 1);
    assert.equal(reminders.length, 1);
    assert.match(reminders[0].body, /^Te quedan 8 días y vencen el /);
  });

  it('el aniversario vence el periodo, cancela pendientes viejas y abre el nuevo sin arrastrar días', async () => {
    const oldDay = addDays(periodEnd, -3);
    const [{ notice_id: pendingId }] = await db('notices')
      .insert({
        employee_id: JUAN,
        reason_id: VACATION,
        kind: 'request',
        status: 'pending',
        absence_start_date: oldDay,
        absence_end_date: oldDay,
      })
      .returning('notice_id');

    const anniversary = addDays(periodEnd, 1);
    const summary = await generate(anniversary);

    const periods = await db('vacation_entitlements').where({ employee_id: JUAN }).orderBy('period_start').select();
    const current = periods[periods.length - 1];
    assert.ok(summary.expired >= 1);
    assert.equal(periods[0].status, 'inactive');
    assert.deepEqual([current.period_start, current.years_of_service, current.total_days, current.used_days], [anniversary, 2, 14, 0]);
    assert.equal((await db('notices').where({ notice_id: pendingId }).first('status')).status, 'cancelled');
    assert.equal((await juanNotifications('period_opened')).length, 1);
  });
});

describe('/me/notifications', () => {
  it('el empleado ve sus avisos y los marca como leídos', async () => {
    const mine = await call('EMPLOYEE', 'GET', '/me/notifications');
    assert.ok(mine.result.data.length >= 2);
    assert.equal(mine.result.unread, mine.result.data.length);

    const read = await call('EMPLOYEE', 'POST', '/me/notifications/read');
    assert.equal(read.result.unread, 0);
  });
});
