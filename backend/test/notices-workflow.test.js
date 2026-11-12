require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';
const HR_USER_ID = 2;
const OWN_EMPLOYEE = 1;
const OTHER_BRANCH_EMPLOYEE = 6;
const FUTURE = '2027-06-01';
const PAST = '2026-01-05';

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

const call = (role, method, url, payload) =>
  server.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${tokens[role]}` } });

const requestFor = (employeeId, date = FUTURE) => ({
  employee_id: employeeId,
  reason_id: 1,
  absence_start_date: date,
  absence_end_date: date,
});

const createRequest = async () => (await call('EMPLOYEE', 'POST', '/notices', requestFor(OWN_EMPLOYEE))).result;

const insertNotice = async (data) => {
  const [row] = await db('notices')
    .insert({ reason_id: 1, kind: 'request', status: 'pending', ...data })
    .returning('notice_id');
  return row.notice_id;
};

describe('Alta de solicitudes y avisos', () => {
  it('la solicitud del empleado nace pendiente', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices', requestFor(OWN_EMPLOYEE));

    assert.equal(res.statusCode, 201);
    assert.equal(res.result.kind, 'request');
    assert.equal(res.result.status, 'pending');
    assert.equal(res.result.approved_by, null);
  });

  it('el empleado no puede mandar el estado ni quién aprueba', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices', { ...requestFor(OWN_EMPLOYEE), status: 'approved' });

    assert.equal(res.statusCode, 400);
  });

  it('el aviso que registra RH nace aprobado por quien lo registra', async () => {
    const res = await call('USER', 'POST', '/notices', requestFor(2));

    assert.equal(res.statusCode, 201);
    assert.equal(res.result.kind, 'notice');
    assert.equal(res.result.status, 'approved');
    assert.equal(res.result.approved_by, HR_USER_ID);
    assert.equal(res.result.created_by, HR_USER_ID);
    assert.ok(res.result.approved_at);
  });

  it('PATCH ya no cambia el estado', async () => {
    const notice = await createRequest();
    const res = await call('USER', 'PATCH', `/notices/${notice.notice_id}`, { status: 'approved' });

    assert.equal(res.statusCode, 400);
  });
});

describe('Aprobar, rechazar y cancelar', () => {
  it('RH aprueba una solicitud pendiente y queda registrado quién', async () => {
    const notice = await createRequest();
    const res = await call('USER', 'POST', `/notices/${notice.notice_id}/approve`);

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.status, 'approved');
    assert.equal(res.result.approved_by, HR_USER_ID);
  });

  it('aprobar dos veces responde 409', async () => {
    const notice = await createRequest();
    await call('USER', 'POST', `/notices/${notice.notice_id}/approve`);
    const res = await call('USER', 'POST', `/notices/${notice.notice_id}/approve`);

    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.code, 'INVALID_TRANSITION');
  });

  it('una rechazada ya no se puede cancelar', async () => {
    const notice = await createRequest();
    assert.equal((await call('USER', 'POST', `/notices/${notice.notice_id}/reject`)).result.status, 'rejected');

    const res = await call('USER', 'POST', `/notices/${notice.notice_id}/cancel`);
    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.message, 'No se puede cancelar un aviso rechazado');
  });

  it('RH cancela una aprobada que aún no empieza', async () => {
    const notice = await createRequest();
    await call('USER', 'POST', `/notices/${notice.notice_id}/approve`);
    const res = await call('USER', 'POST', `/notices/${notice.notice_id}/cancel`);

    assert.equal(res.result.status, 'cancelled');
  });

  it('RH no cancela una aprobada que ya empezó', async () => {
    const noticeId = await insertNotice({ employee_id: OWN_EMPLOYEE, status: 'approved', absence_start_date: PAST, absence_end_date: PAST });
    const res = await call('USER', 'POST', `/notices/${noticeId}/cancel`);

    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.message, 'No se puede cancelar: la ausencia ya empezó');
  });

  it('RH no ve ni resuelve solicitudes de otra sede', async () => {
    const noticeId = await insertNotice({ employee_id: OTHER_BRANCH_EMPLOYEE, absence_start_date: FUTURE, absence_end_date: FUTURE });

    assert.equal((await call('USER', 'POST', `/notices/${noticeId}/approve`)).statusCode, 404);
    assert.equal((await call('SUPERUSER', 'POST', `/notices/${noticeId}/approve`)).statusCode, 200);
  });

  it('RH solo hace las acciones que tiene permitidas', async () => {
    await call('SUPERUSER', 'PATCH', `/users/${HR_USER_ID}`, { review_actions: ['reject', 'cancel'] });
    const notice = await createRequest();

    const res = await call('USER', 'POST', `/notices/${notice.notice_id}/approve`);
    assert.equal(res.statusCode, 403);
    assert.equal(res.result.error.code, 'REVIEW_ACTION_FORBIDDEN');
    assert.equal((await call('USER', 'POST', `/notices/${notice.notice_id}/reject`)).statusCode, 200);

    await call('SUPERUSER', 'PATCH', `/users/${HR_USER_ID}`, { review_actions: ['approve', 'reject', 'cancel'] });
  });

  it('el empleado cancela su solicitud pendiente', async () => {
    const notice = await createRequest();
    const res = await call('EMPLOYEE', 'POST', `/notices/${notice.notice_id}/cancel`);

    assert.equal(res.result.status, 'cancelled');
  });

  it('el empleado no cancela una aprobada ni aprueba', async () => {
    const notice = await createRequest();
    assert.equal((await call('EMPLOYEE', 'POST', `/notices/${notice.notice_id}/approve`)).statusCode, 403);

    await call('USER', 'POST', `/notices/${notice.notice_id}/approve`);
    const res = await call('EMPLOYEE', 'POST', `/notices/${notice.notice_id}/cancel`);
    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.message, 'No se puede cancelar un aviso aprobado');
  });
});

describe('Filtros', () => {
  it('kind separa solicitudes de avisos', async () => {
    const notices = await call('SUPERUSER', 'GET', '/notices?kind=notice&pageSize=100');

    assert.ok(notices.result.data.length > 0);
    assert.ok(notices.result.data.every((row) => row.kind === 'notice'));
  });

  it('from y to devuelven las ausencias que se cruzan con el rango', async () => {
    const res = await call('SUPERUSER', 'GET', `/notices?from=${FUTURE}&to=${FUTURE}&pageSize=100`);
    const rows = res.result.data;

    assert.ok(rows.length > 0);
    assert.ok(rows.every((row) => row.absence_start_date <= FUTURE && row.absence_end_date >= FUTURE));
  });
});
