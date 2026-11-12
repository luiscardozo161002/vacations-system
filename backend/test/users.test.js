require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

let server;
let token;

before(async () => {
  server = await createServer();
  await server.initialize();
  const res = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'sysadmin@grupo-jo.com', password: 'Vacaciones2026!' },
  });
  token = res.result.accessToken;
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const call = (method, url, payload) =>
  server.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${token}` } });

describe('Usuarios', () => {
  it('el listado trae rol, empleado vinculado y sedes', async () => {
    const res = await call('GET', '/users');
    const hr = res.result.data.find((user) => user.username === 'r.jimenez');

    assert.equal(hr.role_code, 'USER');
    assert.equal(hr.employee_name, 'Roberto Jimenez Cruz');
    assert.deepEqual(hr.branch_codes, ['THH_HGO']);
    assert.equal(hr.password_hash, undefined);
  });

  it('el alta devuelve el usuario listo para la tabla', async () => {
    const res = await call('POST', '/users', {
      username: 'rh.pruebas',
      email: 'rh.pruebas@thh.com.mx',
      password: 'Temporal2026!',
      role_id: (await db('roles').where({ role_code: 'USER' }).first('role_id')).role_id,
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.result.role_code, 'USER');
    assert.deepEqual(res.result.branch_codes, []);
    assert.deepEqual(res.result.review_actions, ['approve', 'reject', 'cancel']);
  });
});
