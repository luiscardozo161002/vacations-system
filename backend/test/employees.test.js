require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';

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
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const search = async (role, text) => {
  const res = await server.inject({
    url: `/api/v1/employees?search=${encodeURIComponent(text)}`,
    headers: { authorization: `Bearer ${tokens[role]}` },
  });
  return res.result.data.map((employee) => employee.employee_name);
};

describe('GET /employees?search', () => {
  it('busca por parte del nombre sin importar mayúsculas', async () => {
    assert.deepEqual(await search('SUPERUSER', 'PEREZ'), ['Juan Perez Lopez']);
  });

  it('busca por número de empleado', async () => {
    assert.deepEqual(await search('SUPERUSER', 'emp-012'), ['Sofia Hernandez Paredes']);
  });

  it('respeta las sedes del usuario', async () => {
    assert.deepEqual(await search('SUPERUSER', 'Laura'), ['Laura Sanchez Ortiz']);
    assert.deepEqual(await search('USER', 'Laura'), []);
  });
});
