require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';
const JUAN = { employee_id: 1, user_id: 4 };
const JORGE = { employee_id: 11, user_id: 3 };

let server;
const tokens = {};

const login = async (email) => {
  const res = await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: PASSWORD } });
  return res.result.accessToken;
};

const call = (role, method, url, payload) =>
  server.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${tokens[role]}` } });

const absence = (employeeId, start, end = start) => ({
  employee_id: employeeId,
  reason_id: 1,
  absence_start_date: start,
  absence_end_date: end,
});

const notificationsOf = (userId) =>
  db('notifications').where('user_id', userId).whereNot('kind', 'like', 'period_%').orderBy('notification_id').select('kind', 'title', 'body', 'link');

before(async () => {
  await db.seed.run();
  server = await createServer();
  await server.initialize();
  tokens.USER = await login('r.jimenez@thh.com.mx');
  tokens.JUAN = await login('j.perez@jo.com.mx');
});

after(async () => {
  await db.seed.run();
  await server.stop();
  await db.destroy();
});

describe('Pendientes en la campana', () => {
  it('RH ve las solicitudes pendientes de sus sedes', async () => {
    await call('JUAN', 'POST', '/notices', absence(JUAN.employee_id, '2027-06-01'));
    const expected = await call('USER', 'GET', '/notices?status=pending&pageSize=100');

    const res = await call('USER', 'GET', '/me/notifications');

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.pending.total, expected.result.pagination.total);
    assert.ok(res.result.pending.data.some((notice) => notice.employee_name === 'Juan Perez Lopez'));
  });

  it('el Empleado no tiene pendientes que revisar', async () => {
    const res = await call('JUAN', 'GET', '/me/notifications');
    assert.deepEqual(res.result.pending, { total: 0, data: [] });
  });
});

describe('Resoluciones para el empleado', () => {
  it('le avisa cuando RH aprueba o rechaza su solicitud', async () => {
    const first = await call('JUAN', 'POST', '/notices', absence(JUAN.employee_id, '2027-06-02'));
    const second = await call('JUAN', 'POST', '/notices', absence(JUAN.employee_id, '2027-06-03'));
    await db('notifications').where('user_id', JUAN.user_id).del();

    await call('USER', 'POST', `/notices/${first.result.notice_id}/approve`);
    await call('USER', 'POST', `/notices/${second.result.notice_id}/reject`);

    const reasonName = first.result.reason_description;
    assert.deepEqual(await notificationsOf(JUAN.user_id), [
      { kind: 'request_approved', title: 'Tu solicitud fue aprobada', body: `${reasonName}, el 02/06/2027.`, link: '/solicitudes' },
      { kind: 'request_rejected', title: 'Tu solicitud fue rechazada', body: `${reasonName}, el 03/06/2027.`, link: '/solicitudes' },
    ]);

    const mine = await call('JUAN', 'GET', '/me/notifications');
    assert.equal(mine.result.unread, 2);
  });

  it('no le avisa de lo que él mismo cancela', async () => {
    const created = await call('JUAN', 'POST', '/notices', absence(JUAN.employee_id, '2027-06-04'));
    await db('notifications').where('user_id', JUAN.user_id).del();

    const res = await call('JUAN', 'POST', `/notices/${created.result.notice_id}/cancel`);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(await notificationsOf(JUAN.user_id), []);
  });

  it('le avisa cuando RH le registra un aviso', async () => {
    const res = await call('USER', 'POST', '/notices', absence(JORGE.employee_id, '2027-06-07', '2027-06-08'));

    assert.equal(res.statusCode, 201);
    const [notification] = await notificationsOf(JORGE.user_id);
    assert.equal(notification.kind, 'notice_approved');
    assert.equal(notification.title, 'Recursos Humanos registró un aviso de ausencia');
    assert.equal(notification.body, `${res.result.reason_description}, del 07/06/2027 al 08/06/2027.`);
    assert.equal(notification.link, '/avisos');
  });
});
