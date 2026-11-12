require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';

let server;

before(async () => {
  server = await createServer();
  await server.initialize();
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const login = (payload) => server.inject({ method: 'POST', url: '/api/v1/auth/login', payload });

const tokenFor = async (email) => {
  const res = await login({ email, password: PASSWORD });
  return res.result.accessToken;
};

describe('POST /auth/login', () => {
  it('inicia sesion con correo y contraseña', async () => {
    const res = await login({ email: 'r.jimenez@thh.com.mx', password: PASSWORD });

    assert.equal(res.statusCode, 200);
    assert.ok(res.result.accessToken);
    assert.ok(res.result.refreshToken);
  });

  it('inicia sesion con username', async () => {
    const res = await login({ username: 'j.perez', password: PASSWORD });

    assert.equal(res.statusCode, 200);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const res = await login({ email: 'r.jimenez@thh.com.mx', password: 'incorrecta' });

    assert.equal(res.statusCode, 401);
    assert.equal(res.result.error.code, 'INVALID_CREDENTIALS');
  });

  it('responde igual a un correo que no existe', async () => {
    const res = await login({ email: 'nadie@ejemplo.com', password: PASSWORD });

    assert.equal(res.statusCode, 401);
    assert.equal(res.result.error.code, 'INVALID_CREDENTIALS');
  });

  it('bloquea la cuenta al quinto intento fallido seguido', async () => {
    const attempt = () => login({ email: 'j.navarro@jo.com.mx', password: 'incorrecta' });

    for (let i = 0; i < 4; i += 1) {
      assert.equal((await attempt()).statusCode, 401);
    }
    const fifth = await attempt();

    assert.equal(fifth.statusCode, 423);
    assert.equal(fifth.result.error.code, 'ACCOUNT_LOCKED');
  });
});

describe('rutas protegidas', () => {
  it('health no pide token', async () => {
    const res = await server.inject('/api/v1/health');

    assert.equal(res.statusCode, 200);
  });

  it('responde 401 sin token', async () => {
    const res = await server.inject('/api/v1/employees');

    assert.equal(res.statusCode, 401);
  });

  it('responde 401 con un token invalido', async () => {
    const res = await server.inject({ url: '/api/v1/employees', headers: { authorization: 'Bearer no.es.valido' } });

    assert.equal(res.statusCode, 401);
  });

  it('responde 200 con un token valido', async () => {
    const token = await tokenFor('r.jimenez@thh.com.mx');
    const res = await server.inject({ url: '/api/v1/employees', headers: { authorization: `Bearer ${token}` } });

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.result.data));
  });
});

describe('GET /auth/me', () => {
  it('devuelve el rol, el empleado vinculado y los permisos', async () => {
    const token = await tokenFor('r.jimenez@thh.com.mx');
    const res = await server.inject({ url: '/api/v1/auth/me', headers: { authorization: `Bearer ${token}` } });

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.role.role_code, 'USER');
    assert.equal(res.result.employee.employee_id, 5);
    assert.ok(res.result.permissions.includes('approvals:review'));
  });
});
