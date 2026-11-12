require('./env');

const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { setTimeout: wait } = require('node:timers/promises');
const createServer = require('../src/server');
const { holidaysOfYear } = require('../src/lib/holidays');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';
const EMPLOYEE = 1;
const NEW_HIRE = 10;
const VACATION = 5;
const PERSONAL_LEAVE = 1;

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const firstMondayFrom = (date) => {
  let day = date;
  while (day.getDay() !== 1) day = addDays(day, 1);
  return day;
};

const monday = firstMondayFrom(addDays(new Date(), 7));
const MONDAY = iso(monday);
const FRIDAY = iso(addDays(monday, 4));
const SUNDAY = iso(addDays(monday, 6));
const NEXT_FRIDAY = iso(addDays(monday, 11));

let server;
const tokens = {};

const login = async (email) => {
  const res = await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: PASSWORD } });
  return res.result.accessToken;
};

before(async () => {
  server = await createServer();
  await server.initialize();
  tokens.USER = await login('r.jimenez@thh.com.mx');
  tokens.EMPLOYEE = await login('j.perez@jo.com.mx');
});

beforeEach(async () => {
  await db('vacation_entitlements')
    .where({ employee_id: EMPLOYEE })
    .update({
      period_start: db.raw("CURRENT_DATE - INTERVAL '30 days'"),
      period_end: db.raw("CURRENT_DATE + INTERVAL '300 days'"),
      total_days: 12,
      used_days: 5,
      used_hours: 0,
    });
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const call = (role, method, url, payload) =>
  server.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${tokens[role]}` } });

const vacation = (start, end = start, extra = {}) => ({
  employee_id: EMPLOYEE,
  reason_id: VACATION,
  absence_start_date: start,
  absence_end_date: end,
  ...extra,
});

const usedBalance = () =>
  db('vacation_entitlements').where({ employee_id: EMPLOYEE }).first('used_days', 'used_hours');

describe('POST /notices/preview', () => {
  it('desglosa una semana de vacaciones y el saldo que queda', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices/preview', vacation(MONDAY, FRIDAY));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.result.breakdown, { days: 5, hours: 0, rest_days: 0, holidays: 0, daily_hours: 8 });
    assert.deepEqual(res.result.balance.available, { days: 7, hours: 0 });
    assert.deepEqual(res.result.balance.remaining, { days: 2, hours: 0 });
    assert.equal(res.result.error, null);
    assert.equal(res.result.used, undefined);
  });

  it('desglosa horas sueltas', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices/preview', vacation(MONDAY, MONDAY, {
      absence_start_time: '13:00',
      absence_end_time: '15:00',
    }));

    assert.deepEqual(res.result.breakdown, { days: 0, hours: 2, rest_days: 0, holidays: 0, daily_hours: 8 });
    assert.deepEqual(res.result.balance.remaining, { days: 6, hours: 6 });
  });

  it('avisa cuando excede el saldo sin rechazar la vista previa', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices/preview', vacation(MONDAY, NEXT_FRIDAY));

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.breakdown.days, 11);
    assert.deepEqual(res.result.error, {
      code: 'INSUFFICIENT_BALANCE',
      message: 'Excede el saldo disponible de 7 días',
    });
  });
});

describe('Reglas al crear', () => {
  it('rechaza vacaciones que exceden el saldo', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices', vacation(MONDAY, NEXT_FRIDAY));

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'INSUFFICIENT_BALANCE');
  });

  it('rechaza vacaciones de quien no cumple un año', async () => {
    const res = await call('USER', 'POST', '/notices', { ...vacation(MONDAY), employee_id: NEW_HIRE });

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'NO_VACATION_YET');
  });

  it('rechaza fechas fuera del periodo vigente', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices', vacation(iso(addDays(new Date(), 400))));

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'OUTSIDE_PERIOD');
  });

  it('rechaza pedir solo un festivo, para cualquier rol', async () => {
    const holiday = holidaysOfYear(new Date().getFullYear() + 1).find((day) => day.name === 'Día de la Revolución').date;
    const res = await call('USER', 'POST', '/notices', { ...vacation(holiday), reason_id: PERSONAL_LEAVE });

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'MANDATORY_REST_DAY');
    assert.equal(res.result.error.message, 'Ese día no se puede porque es descanso obligatorio por la Ley Federal del Trabajo');
  });

  it('rechaza una ausencia que solo cae en días de descanso', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices', { ...vacation(SUNDAY), reason_id: PERSONAL_LEAVE });

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'NO_WORKING_DAYS');
  });

  it('guarda los días y horas que consume la solicitud', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices', vacation(MONDAY, MONDAY, {
      absence_start_time: '09:00',
      absence_end_time: '12:30',
    }));

    assert.equal(res.result.days_taken, 0);
    assert.equal(res.result.hours_taken, 3.5);
  });
});

describe('Descuento y devolución', () => {
  it('la solicitud pendiente no descuenta; al aprobarla sí', async () => {
    const request = (await call('EMPLOYEE', 'POST', '/notices', vacation(MONDAY))).result;
    assert.deepEqual(await usedBalance(), { used_days: 5, used_hours: 0 });

    const approved = await call('USER', 'POST', `/notices/${request.notice_id}/approve`);

    assert.equal(approved.statusCode, 200);
    assert.ok(approved.result.entitlement_id);
    assert.deepEqual(await usedBalance(), { used_days: 6, used_hours: 0 });
  });

  it('cancelar una aprobada devuelve el saldo', async () => {
    const request = (await call('EMPLOYEE', 'POST', '/notices', vacation(MONDAY, FRIDAY))).result;
    await call('USER', 'POST', `/notices/${request.notice_id}/approve`);
    assert.deepEqual(await usedBalance(), { used_days: 10, used_hours: 0 });

    await call('USER', 'POST', `/notices/${request.notice_id}/cancel`);
    assert.deepEqual(await usedBalance(), { used_days: 5, used_hours: 0 });
  });

  it('el aviso de vacaciones que registra RH descuenta al momento y las horas se juntan en días', async () => {
    const hours = (from, to) => vacation(MONDAY, MONDAY, { absence_start_time: from, absence_end_time: to });

    const first = await call('USER', 'POST', '/notices', hours('07:00', '12:00'));
    assert.equal(first.result.status, 'approved');
    assert.deepEqual(await usedBalance(), { used_days: 5, used_hours: 5 });

    await call('USER', 'POST', '/notices', hours('12:00', '15:00'));
    assert.deepEqual(await usedBalance(), { used_days: 6, used_hours: 0 });

    await call('USER', 'POST', `/notices/${first.result.notice_id}/cancel`);
    assert.deepEqual(await usedBalance(), { used_days: 5, used_hours: 3 });
  });

  it('el saldo y la solicitud traen nombres y lo disponible real con horas', async () => {
    const created = await call('USER', 'POST', '/notices', vacation(MONDAY, MONDAY, {
      absence_start_time: '13:00',
      absence_end_time: '15:00',
    }));
    assert.equal(created.result.employee_name, 'Juan Perez Lopez');
    assert.equal(created.result.reason_description, 'Vacaciones');
    assert.equal(created.result.department_name, 'Explotacion');

    const balances = await call('EMPLOYEE', 'GET', '/vacation-entitlements');
    const balance = balances.result.data[0];

    assert.equal(balance.employee_name, 'Juan Perez Lopez');
    assert.equal(balance.daily_hours, 8);
    assert.deepEqual(balance.available, { days: 6, hours: 6 });
    assert.equal(balance.remaining_days, undefined);
  });

  it('un permiso que no es vacaciones no toca el saldo', async () => {
    const request = (await call('EMPLOYEE', 'POST', '/notices', { ...vacation(MONDAY), reason_id: PERSONAL_LEAVE })).result;
    await call('USER', 'POST', `/notices/${request.notice_id}/approve`);

    assert.deepEqual(await usedBalance(), { used_days: 5, used_hours: 0 });
  });

  it('aprobar espera a otra operación sobre el mismo saldo y usa el saldo actualizado', async () => {
    const request = (await call('EMPLOYEE', 'POST', '/notices', vacation(MONDAY, iso(addDays(monday, 3))))).result;

    const trx = await db.transaction();
    await trx('vacation_entitlements').where({ employee_id: EMPLOYEE }).forUpdate().first();
    const approval = call('USER', 'POST', `/notices/${request.notice_id}/approve`);
    await wait(300);
    await trx('vacation_entitlements').where({ employee_id: EMPLOYEE }).update({ used_days: 11 });
    await trx.commit();

    const res = await approval;
    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'INSUFFICIENT_BALANCE');
    assert.deepEqual(await usedBalance(), { used_days: 11, used_hours: 0 });
  });
});

describe('Edición', () => {
  it('cambiar las fechas de una pendiente recalcula lo que consume', async () => {
    const request = (await call('EMPLOYEE', 'POST', '/notices', vacation(MONDAY))).result;
    const res = await call('USER', 'PATCH', `/notices/${request.notice_id}`, { absence_end_date: FRIDAY });

    assert.equal(res.result.days_taken, 5);
  });

  it('una aprobada ya no cambia de fechas', async () => {
    const request = (await call('EMPLOYEE', 'POST', '/notices', vacation(MONDAY))).result;
    await call('USER', 'POST', `/notices/${request.notice_id}/approve`);
    const res = await call('USER', 'PATCH', `/notices/${request.notice_id}`, { absence_end_date: FRIDAY });

    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.code, 'NOTICE_LOCKED');
  });
});
