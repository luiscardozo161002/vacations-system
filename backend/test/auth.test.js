require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');
const repository = require('../src/plugins/auth/repository');

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
const postAuth = (path, payload) => server.inject({ method: 'POST', url: `/api/v1/auth/${path}`, payload });

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
    assert.match(res.headers['www-authenticate'], /^Bearer\b/i);
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

describe('POST /auth/refresh', () => {
  it('rota un token una sola vez si llegan dos peticiones simultáneas', async () => {
    const loggedIn = await login({ username: 'r.jimenez', password: PASSWORD });
    assert.equal(loggedIn.statusCode, 200);
    const { refreshToken } = loggedIn.result;

    const responses = await Promise.all([postAuth('refresh', { refreshToken }), postAuth('refresh', { refreshToken })]);
    assert.deepEqual(responses.map((res) => res.statusCode).sort(), [200, 401]);
    assert.equal(responses.find((res) => res.statusCode === 401).result.error.code, 'INVALID_REFRESH_TOKEN');
    const renewed = responses.find((res) => res.statusCode === 200).result;
    assert.notEqual(renewed.refreshToken, refreshToken);
    assert.equal((await postAuth('refresh', { refreshToken: renewed.refreshToken })).statusCode, 200);
  });

  it('conserva la sesión anterior si falla la auditoría de la renovación', async (t) => {
    const loggedIn = await login({ username: 'r.jimenez', password: PASSWORD });
    assert.equal(loggedIn.statusCode, 200);
    const { refreshToken } = loggedIn.result;
    const audit = t.mock.method(repository, 'logAuditEvent', async () => {
      throw new Error('Fallo de auditoría');
    });

    const failed = await postAuth('refresh', { refreshToken });
    assert.equal(failed.statusCode, 500);
    assert.equal(failed.result.error.code, 'INTERNAL_ERROR');

    audit.mock.restore();
    assert.equal((await postAuth('refresh', { refreshToken })).statusCode, 200);
  });
});

describe('POST /auth/password-reset/confirm', () => {
  const email = 'reset-test@example.com';
  let userId;

  before(async () => {
    const { role_id, password_hash } = await db('users').where('username', 'j.perez').first('role_id', 'password_hash');
    const [user] = await db('users').insert({ username: 'reset-test', email, role_id, password_hash }).returning('user_id');
    userId = user.user_id;
  });

  after(async () => {
    if (userId === undefined) return;
    await db('auth_audit_log').where('user_id', userId).del();
    await db('password_reset_tokens').where('user_id', userId).del();
    await db('user_sessions').where('user_id', userId).del();
    await db('users').where('user_id', userId).del();
  });

  const requestResetToken = async () => {
    const res = await postAuth('password-reset/request', { email });
    assert.equal(res.statusCode, 200);
    assert.ok(res.result.devToken);
    return res.result.devToken;
  };

  it('consume el token una sola vez y revoca las sesiones y los códigos pendientes', async () => {
    const loggedIn = await login({ email, password: PASSWORD });
    assert.equal(loggedIn.statusCode, 200);
    const otherToken = await requestResetToken();
    const token = await requestResetToken();
    const payload = { token, newPassword: 'NuevaClave2026!' };

    const responses = await Promise.all([postAuth('password-reset/confirm', payload), postAuth('password-reset/confirm', payload)]);
    assert.deepEqual(responses.map((res) => res.statusCode).sort(), [200, 401]);
    assert.equal(responses.find((res) => res.statusCode === 401).result.error.code, 'INVALID_RESET_TOKEN');
    assert.equal((await postAuth('password-reset/confirm', { ...payload, token: otherToken })).statusCode, 401);
    assert.equal((await postAuth('refresh', { refreshToken: loggedIn.result.refreshToken })).statusCode, 401);
    assert.equal((await login({ email, password: payload.newPassword })).statusCode, 200);
  });

  it('rechaza un código previo a la baja y conserva el estado de la cuenta', async () => {
    const token = await requestResetToken();
    await db('users').where('user_id', userId).update({ status: 'inactive' });

    const res = await postAuth('password-reset/confirm', { token, newPassword: 'OtraClave2026!' });
    assert.equal(res.statusCode, 401);
    assert.equal(res.result.error.code, 'INVALID_RESET_TOKEN');
    const user = await db('users').where('user_id', userId).first('status');
    assert.equal(user.status, 'inactive');
  });
});
