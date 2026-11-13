require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';

let server;
let rh;

const call = (method, url, payload, token = rh) =>
  server.inject({ method, url, payload, headers: token ? { authorization: `Bearer ${token}` } : {} });

const login = (email, password) => call('POST', '/api/v1/auth/login', { email, password }, null);

const newEmployee = (number, extra = {}) =>
  call('POST', '/api/v1/employees', {
    department_id: 1,
    shift_id: 2,
    folio: number,
    employee_number: number,
    employee_name: `Empleado ${number}`,
    start_date: '2026-11-01',
    ...extra,
  });

before(async () => {
  await db.seed.run();
  server = await createServer();
  await server.initialize();
  rh = (await login('r.jimenez@thh.com.mx', PASSWORD)).result.accessToken;
});

after(async () => {
  await db.seed.run();
  await server.stop();
  await db.destroy();
});

describe('Alta de empleado con correo', () => {
  it('crea su cuenta de Empleado con contraseña temporal de un mes', async () => {
    const res = await newEmployee('ACC-001', { email: 'm.lopez@thh.com.mx' });

    assert.equal(res.statusCode, 201);
    assert.equal(res.result.account.username, 'm.lopez');
    assert.equal(res.result.account.role_code, 'EMPLOYEE');
    assert.equal(res.result.account.must_change_password, true);
    assert.equal(res.result.temporary_password.length, 10);

    const days = (new Date(res.result.account.temporary_password_expires_at) - Date.now()) / 86400000;
    assert.ok(days > 27 && days < 32);
  });

  it('obliga a cambiar la temporal y la limpia al cambiarla', async () => {
    const created = await newEmployee('ACC-002', { email: 'p.ruiz@thh.com.mx' });
    const first = await login('p.ruiz@thh.com.mx', created.result.temporary_password);
    assert.equal(first.statusCode, 200);
    assert.equal(first.result.must_change_password, true);

    const changed = await call(
      'POST',
      '/api/v1/auth/me/password',
      { currentPassword: created.result.temporary_password, newPassword: 'MiClaveNueva2026!' },
      first.result.accessToken
    );
    assert.equal(changed.statusCode, 200);

    const me = await call('GET', '/api/v1/auth/me', undefined, changed.result.accessToken);
    assert.equal(me.result.must_change_password, false);
    assert.equal(me.result.temporary_password_expires_at, null);
  });

  it('usa otro nombre de usuario si el del correo ya existe', async () => {
    const res = await newEmployee('ACC-003', { email: 'j.perez@thh.com.mx' });
    assert.equal(res.result.account.username, 'j.perez2');
  });

  it('no crea el empleado si el correo ya está en uso', async () => {
    const res = await newEmployee('ACC-004', { email: 'j.navarro@jo.com.mx' });
    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.code, 'EMAIL_EXISTS');
    assert.equal(await db('employees').where('employee_number', 'ACC-004').first(), undefined);
  });

  it('sin correo da de alta al empleado sin cuenta', async () => {
    const res = await newEmployee('ACC-005');
    assert.equal(res.statusCode, 201);
    assert.equal(res.result.account, null);
    assert.equal(res.result.temporary_password, undefined);
  });
});

describe('Contraseña temporal vencida', () => {
  it('rechaza el login y pide acudir a RH', async () => {
    const created = await newEmployee('ACC-010', { email: 'v.mora@thh.com.mx' });
    await db('users')
      .where('user_id', created.result.account.user_id)
      .update({ temporary_password_expires_at: new Date(Date.now() - 1000).toISOString() });

    const res = await login('v.mora@thh.com.mx', created.result.temporary_password);
    assert.equal(res.statusCode, 403);
    assert.equal(res.result.error.code, 'TEMPORARY_PASSWORD_EXPIRED');
  });
});

describe('POST /employees/{id}/access', () => {
  it('pide el correo cuando el empleado no tiene cuenta', async () => {
    const res = await call('POST', '/api/v1/employees/2/access');
    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'EMAIL_REQUIRED');
  });

  it('crea la cuenta y luego reenvía una temporal nueva', async () => {
    const created = await call('POST', '/api/v1/employees/2/access', { email: 'm.garcia@thh.com.mx' });
    assert.equal(created.statusCode, 200);
    const session = await login('m.garcia@thh.com.mx', created.result.temporary_password);
    assert.equal(session.statusCode, 200);

    const renewed = await call('POST', '/api/v1/employees/2/access');
    assert.equal(renewed.statusCode, 200);
    assert.notEqual(renewed.result.temporary_password, created.result.temporary_password);

    assert.equal((await login('m.garcia@thh.com.mx', created.result.temporary_password)).statusCode, 401);
    assert.equal((await login('m.garcia@thh.com.mx', renewed.result.temporary_password)).statusCode, 200);

    const refresh = await call('POST', '/api/v1/auth/refresh', { refreshToken: session.result.refreshToken }, null);
    assert.equal(refresh.statusCode, 401);
  });

  it('el detalle del empleado muestra su cuenta', async () => {
    const res = await call('GET', '/api/v1/employees/2');
    assert.equal(res.result.account.email, 'm.garcia@thh.com.mx');
    assert.equal(res.result.account.must_change_password, true);
  });

  it('no toca cuentas administrativas', async () => {
    const res = await call('POST', '/api/v1/employees/5/access');
    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.code, 'ACCOUNT_NOT_EMPLOYEE');
  });

  it('respeta las sedes de RH', async () => {
    const res = await call('POST', '/api/v1/employees/6/access', { email: 'l.sanchez@jo.com.mx' });
    assert.equal(res.statusCode, 404);
  });

  it('no envía acceso a empleados dados de baja', async () => {
    await db('employees').where('employee_id', 3).update({ status: 'inactive' });
    const res = await call('POST', '/api/v1/employees/3/access', { email: 'c.ramirez@thh.com.mx' });
    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.code, 'EMPLOYEE_INACTIVE');
  });

  it('un Empleado no puede enviar accesos', async () => {
    const employee = (await login('j.perez@jo.com.mx', PASSWORD)).result.accessToken;
    const res = await call('POST', '/api/v1/employees/4/access', { email: 'a.torres@thh.com.mx' }, employee);
    assert.equal(res.statusCode, 403);
  });
});
