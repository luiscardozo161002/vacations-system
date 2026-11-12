require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';
const THH_HGO = 5;
const JOR_HGO = 3;
const THH_HGO_EMPLOYEES = [1, 2, 3, 4, 5, 10, 11, 12];
const JOR_HGO_EMPLOYEE = 6;
const JOR_HGO_DEPARTMENT = 3;

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

const ids = (res, column) => res.result.data.map((row) => row[column]);

describe('Alcance por sede', () => {
  it('el Superusuario ve todas las sedes y empleados', async () => {
    assert.equal((await call('SUPERUSER', 'GET', '/branches')).result.pagination.total, 7);
    assert.equal((await call('SUPERUSER', 'GET', '/employees?pageSize=100')).result.pagination.total, 12);
  });

  it('/auth/me devuelve las sedes del Usuario', async () => {
    const res = await call('USER', 'GET', '/auth/me');

    assert.deepEqual(
      res.result.branches.map((branch) => branch.code),
      ['THH_HGO']
    );
  });

  it('el Usuario solo ve su sede, su empresa y sus departamentos', async () => {
    assert.deepEqual(ids(await call('USER', 'GET', '/branches'), 'branch_id'), [THH_HGO]);
    assert.deepEqual(ids(await call('USER', 'GET', '/companies'), 'folio'), ['THH']);
    assert.deepEqual(ids(await call('USER', 'GET', '/departments'), 'department_id'), [1, 2, 8]);
  });

  it('el Usuario solo lista empleados de su sede', async () => {
    const res = await call('USER', 'GET', '/employees?pageSize=100');

    assert.deepEqual(ids(res, 'employee_id'), THH_HGO_EMPLOYEES);
  });

  it('el Usuario recibe 404 al leer o editar un empleado de otra sede', async () => {
    assert.equal((await call('USER', 'GET', `/employees/${JOR_HGO_EMPLOYEE}`)).statusCode, 404);
    assert.equal((await call('USER', 'PATCH', `/employees/${JOR_HGO_EMPLOYEE}`, { folio: 'X' })).statusCode, 404);
    assert.equal((await call('USER', 'DELETE', `/employees/${JOR_HGO_EMPLOYEE}`)).statusCode, 404);
  });

  it('el Usuario no puede mover un empleado a un departamento de otra sede', async () => {
    const res = await call('USER', 'PATCH', '/employees/1', { department_id: JOR_HGO_DEPARTMENT });

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'INVALID_DEPARTMENT');
  });

  it('el Usuario solo ve avisos y saldos de empleados de su sede', async () => {
    const notices = await call('USER', 'GET', '/notices?pageSize=100');
    const balances = await call('USER', 'GET', '/vacation-entitlements?pageSize=100');

    assert.ok(notices.result.data.length > 0);
    assert.ok(ids(notices, 'employee_id').every((id) => THH_HGO_EMPLOYEES.includes(id)));
    assert.ok(ids(balances, 'employee_id').every((id) => THH_HGO_EMPLOYEES.includes(id)));
  });

  it('al asignar otra sede al Usuario, su siguiente token la incluye', async () => {
    const assigned = await call('SUPERUSER', 'PUT', '/users/2/branches', { branch_ids: [THH_HGO, JOR_HGO] });
    assert.deepEqual(
      assigned.result.map((branch) => branch.code),
      ['JOR_HGO', 'THH_HGO']
    );

    const token = await login('r.jimenez@thh.com.mx');
    const res = await server.inject({
      url: `/api/v1/employees/${JOR_HGO_EMPLOYEE}`,
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.statusCode, 200);

    await call('SUPERUSER', 'PUT', '/users/2/branches', { branch_ids: [THH_HGO] });
  });
});

describe('Alcance del Empleado', () => {
  it('solo lista sus propios avisos', async () => {
    const res = await call('EMPLOYEE', 'GET', '/notices?pageSize=100');

    assert.ok(res.result.data.length > 0);
    assert.ok(ids(res, 'employee_id').every((id) => id === 1));
  });

  it('recibe 404 al leer el aviso de otro empleado', async () => {
    const others = await call('SUPERUSER', 'GET', '/notices?employee_id=2');
    const res = await call('EMPLOYEE', 'GET', `/notices/${others.result.data[0].notice_id}`);

    assert.equal(res.statusCode, 404);
  });

  it('no puede crear una solicitud a nombre de otro empleado', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices', {
      employee_id: 2,
      reason_id: 1,
      absence_start_date: '2026-12-01',
      absence_end_date: '2026-12-01',
    });

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'INVALID_EMPLOYEE');
  });
});
