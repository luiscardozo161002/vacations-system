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
  await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'nadie@ejemplo.com', password: 'x' } });
  const res = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'sysadmin@grupo-jo.com', password: 'Vacaciones2026!' },
  });
  token = res.result.accessToken;
  await server.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: { refreshToken: res.result.refreshToken } });
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const list = async (query = '') => {
  const res = await server.inject({ url: `/api/v1/auth-audit-log?pageSize=100${query}`, headers: { authorization: `Bearer ${token}` } });
  return res.result.data;
};

describe('GET /auth-audit-log', () => {
  it('trae el nombre de usuario y el resultado, lo más reciente primero', async () => {
    const [latest] = await list();

    assert.equal(latest.event_type, 'LOGIN_SUCCESS');
    assert.equal(latest.username, 'sysadmin');
    assert.equal(latest.result, 'success');
  });

  it('no muestra renovaciones de sesión salvo que se pidan', async () => {
    assert.ok((await list()).every((entry) => entry.event_type !== 'TOKEN_REFRESH'));
    assert.ok((await list('&event_type=TOKEN_REFRESH')).length > 0);
  });

  it('filtra por resultado y busca por usuario o evento', async () => {
    const failed = await list('&result=failed');
    const byUser = await list('&search=sysadm');

    assert.ok(failed.length > 0);
    assert.ok(failed.every((entry) => entry.result === 'failed'));
    assert.ok(byUser.length > 0);
    assert.ok(byUser.every((entry) => entry.username === 'sysadmin'));
  });
});
