require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';
const JOR_DEPARTMENT = 3;
const THH_DEPARTMENT = 1;
const OTHER_THH_DEPARTMENT = 2;

let server;
let token;
let hrToken;

before(async () => {
  server = await createServer();
  await server.initialize();
  const res = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'sysadmin@grupo-jo.com', password: PASSWORD },
  });
  token = res.result.accessToken;
  hrToken = (await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'r.jimenez@thh.com.mx', password: PASSWORD } })).result.accessToken;
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const call = (method, url, payload, jwt = token) =>
  server.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${jwt}` } });

const newEmployee = (changes) => ({
  department_id: THH_DEPARTMENT,
  shift_id: 2,
  employee_number: '7101',
  employee_name: 'Prueba Empresa Uno',
  start_date: '2026-01-15',
  ...changes,
});

describe('Número de empleado por empresa', () => {
  it('se puede repetir entre empresas pero no dentro de una', async () => {
    const jor = await call('POST', '/employees', newEmployee({ department_id: JOR_DEPARTMENT }));
    const thh = await call('POST', '/employees', newEmployee({ employee_name: 'Prueba Empresa Dos' }));
    const again = await call(
      'POST',
      '/employees',
      newEmployee({ department_id: OTHER_THH_DEPARTMENT, employee_name: 'Prueba Empresa Tres' }),
    );

    assert.equal(jor.statusCode, 201);
    assert.equal(thh.statusCode, 201);
    assert.equal(again.statusCode, 409);
    assert.equal(again.result.error.code, 'EMPLOYEE_NUMBER_EXISTS');
  });

  it('al cambiar de empresa se vuelve a validar el número', async () => {
    const created = await call('POST', '/employees', newEmployee({ employee_number: '7102', employee_name: 'Prueba Cambio' }));
    const clash = await call('POST', '/employees', newEmployee({ employee_number: '7102', department_id: JOR_DEPARTMENT, employee_name: 'Prueba Cambio Dos' }));
    const move = await call('PATCH', `/employees/${created.result.employee_id}`, { department_id: JOR_DEPARTMENT });

    assert.equal(clash.statusCode, 201);
    assert.equal(move.statusCode, 409);
  });
});

describe('Cuentas de empleado', () => {
  it('no se crean desde Usuarios sino desde el empleado', async () => {
    const roleId = (await db('roles').where({ role_code: 'EMPLOYEE' }).first('role_id')).role_id;
    const res = await call('POST', '/users', {
      username: 'empleado.directo',
      email: 'empleado.directo@thh.com.mx',
      password: 'Temporal2026!',
      role_id: roleId,
    });

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'EMPLOYEE_ACCOUNT_FROM_EMPLOYEE');
  });
});

describe('Eliminar y desactivar', () => {
  const names = (res) => res.result.data.map((row) => row.employee_name ?? row.department_name ?? row.username);

  it('un empleado eliminado por RH desaparece para RH pero el superusuario lo sigue viendo inactivo', async () => {
    const created = await call(
      'POST',
      '/employees',
      newEmployee({ employee_number: '7103', employee_name: 'Prueba Eliminar', email: 'prueba.eliminar@thh.com.mx' }),
    );
    const id = created.result.employee_id;
    const username = created.result.account.username;

    assert.equal((await call('DELETE', `/employees/${id}`, undefined, hrToken)).statusCode, 204);

    assert.deepEqual(names(await call('GET', '/employees?search=Prueba%20Eliminar', undefined, hrToken)), []);
    assert.equal((await call('GET', `/employees/${id}`, undefined, hrToken)).statusCode, 404);

    const seen = await call('GET', `/employees/${id}`);
    assert.equal(seen.statusCode, 200);
    assert.equal(seen.result.status, 'inactive');
    assert.deepEqual(names(await call('GET', '/employees?search=Prueba%20Eliminar&status=inactive')), ['Prueba Eliminar']);

    const users = await call('GET', '/users?status=inactive&pageSize=100');
    assert.ok(users.result.data.some((user) => user.username === username));
    assert.equal((await db('users').where('username', username).first()).status, 'inactive');
  });

  it('el superusuario puede reactivar al empleado y su cuenta vuelve con él', async () => {
    const created = await call(
      'POST',
      '/employees',
      newEmployee({ employee_number: '7104', employee_name: 'Prueba Reactivar', email: 'prueba.reactivar@thh.com.mx' }),
    );
    const id = created.result.employee_id;
    const accountStatus = async () => (await db('users').where('employee_id', id).first()).status;

    await call('DELETE', `/employees/${id}`);
    assert.equal(await accountStatus(), 'inactive');

    const back = await call('PATCH', `/employees/${id}`, { status: 'active' });

    assert.equal(back.statusCode, 200);
    assert.equal(await accountStatus(), 'active');
    assert.deepEqual(names(await call('GET', '/employees?search=Prueba%20Reactivar', undefined, hrToken)), ['Prueba Reactivar']);
  });

  it('un departamento inactivo solo lo ve el superusuario', async () => {
    const created = await call('POST', '/departments', { branch_id: 5, code: 'ZZT', department_name: 'Prueba Oculto' });
    await call('DELETE', `/departments/${created.result.department_id}`);

    assert.ok(!names(await call('GET', '/departments?pageSize=100', undefined, hrToken)).includes('Prueba Oculto'));
    assert.ok(names(await call('GET', '/departments?status=inactive&pageSize=100')).includes('Prueba Oculto'));
  });

  it('un usuario desactivado queda visible para el superusuario y no puede entrar', async () => {
    const roleId = (await db('roles').where({ role_code: 'USER' }).first('role_id')).role_id;
    const created = await call('POST', '/users', {
      username: 'rh.eliminar',
      email: 'rh.eliminar@thh.com.mx',
      password: 'Temporal2026!',
      role_id: roleId,
    });

    assert.equal((await call('DELETE', `/users/${created.result.user_id}`)).statusCode, 204);
    assert.ok(names(await call('GET', '/users?status=inactive&pageSize=100')).includes('rh.eliminar'));

    const login = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'rh.eliminar@thh.com.mx', password: 'Temporal2026!' },
    });
    assert.equal(login.result.error.code, 'ACCOUNT_INACTIVE');
  });
});