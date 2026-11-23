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
  tokens.EMPLOYEE = await login('j.perez@jo.com.mx');
  tokens.USER = await login('r.jimenez@thh.com.mx');
});

after(async () => {
  await db('user_settings').del();
  await server.stop();
  await db.destroy();
});

const call = (role, method, url, payload) =>
  server.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${tokens[role]}` } });

describe('Configuración de apariencia por usuario', () => {
  it('sin nada guardado devuelve todo vacío', async () => {
    const res = await call('EMPLOYEE', 'GET', '/me/settings');

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.result, {
      theme: null,
      backdrop_light: null,
      backdrop_dark: null,
      button_color: null,
      window_alpha: null,
    });
  });

  it('guarda y devuelve lo enviado; los siguientes envíos solo cambian sus campos', async () => {
    await call('EMPLOYEE', 'PUT', '/me/settings', { theme: 'dark', button_color: '#7c3aed' });
    const res = await call('EMPLOYEE', 'PUT', '/me/settings', { window_alpha: 0.85 });

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.theme, 'dark');
    assert.equal(res.result.button_color, '#7c3aed');
    assert.equal(res.result.window_alpha, 0.85);
    assert.deepEqual((await call('EMPLOYEE', 'GET', '/me/settings')).result, res.result);
  });

  it('cada usuario guarda lo suyo', async () => {
    const other = await call('USER', 'GET', '/me/settings');

    assert.equal(other.result.theme, null);
  });

  it('rechaza valores fuera de rango o un cuerpo vacío', async () => {
    assert.equal((await call('EMPLOYEE', 'PUT', '/me/settings', { theme: 'rosa' })).statusCode, 400);
    assert.equal((await call('EMPLOYEE', 'PUT', '/me/settings', { window_alpha: 0.1 })).statusCode, 400);
    assert.equal((await call('EMPLOYEE', 'PUT', '/me/settings', { button_color: 'rojo' })).statusCode, 400);
    assert.equal((await call('EMPLOYEE', 'PUT', '/me/settings', {})).statusCode, 400);
  });

  it('exige sesión', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/me/settings' });

    assert.equal(res.statusCode, 401);
  });
});
