require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';
const EXPLOTACION = 1;
const THH = 2;

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

const call = (role, method, url, payload) =>
  server.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${tokens[role]}` } });

describe('Departamentos', () => {
  it('traen responsable, empleados activos, sede y si comparten calendario', async () => {
    const res = await call('USER', 'GET', `/departments/${EXPLOTACION}`);

    assert.equal(res.result.manager_name, 'Jorge Luis Navarro');
    assert.equal(res.result.active_employees, 4);
    assert.equal(res.result.branch_code, 'THH_HGO');
    assert.equal(res.result.calendar_shared, true);
  });

  it('RH edita el departamento y apaga el calendario compartido, pero no crea departamentos', async () => {
    const updated = await call('USER', 'PATCH', `/departments/${EXPLOTACION}`, { calendar_shared: false });
    await call('USER', 'PATCH', `/departments/${EXPLOTACION}`, { calendar_shared: true });

    assert.equal(updated.result.calendar_shared, false);
    assert.equal(updated.result.manager_name, 'Jorge Luis Navarro');
    assert.equal((await call('USER', 'POST', '/departments', { branch_id: 5, code: 'X', department_name: 'X' })).statusCode, 403);
  });
});

describe('Turnos y reglas', () => {
  it('los turnos cuentan sus empleados activos dentro del alcance', async () => {
    const counts = async (role) =>
      Object.fromEntries((await call(role, 'GET', '/shifts')).result.data.map((shift) => [shift.code, shift.active_employees]));

    assert.deepEqual(await counts('SUPERUSER'), { OFICINAS: 2, OPERACIONES: 10 });
    assert.deepEqual(await counts('USER'), { OFICINAS: 1, OPERACIONES: 7 });
  });

  it('una regla no puede cruzarse con otra del mismo año', async () => {
    const res = await call('SUPERUSER', 'POST', '/vacation-accrual-rules', {
      years_from: 3,
      years_to: 4,
      vacation_days: 17,
      effective_year: 2023,
    });

    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.code, 'RULE_OVERLAP');
    assert.equal(res.result.error.message, 'Se cruza con la regla de 3 a 3 años');
  });

  it('"hasta" no puede ser menor que "desde", y RH sí edita los días', async () => {
    const invalid = await call('USER', 'PATCH', '/vacation-accrual-rules/1', { years_to: 0 });
    const valid = await call('USER', 'PATCH', '/vacation-accrual-rules/1', { vacation_days: 12 });

    assert.equal(invalid.result.error.code, 'INVALID_RULE_RANGE');
    assert.equal(valid.statusCode, 200);
  });
});

describe('Sedes y empleados por empresa', () => {
  it('las sedes traen sus empleados activos', async () => {
    const res = await call('SUPERUSER', 'GET', `/branches?company_id=${THH}`);
    const counts = Object.fromEntries(res.result.data.map((branch) => [branch.code, branch.active_employees]));

    assert.deepEqual(counts, { THH_AGS: 1, THH_HGO: 8, THH_PUE: 0 });
  });

  it('los empleados se filtran por empresa', async () => {
    const res = await call('SUPERUSER', 'GET', `/employees?company_id=${THH}&pageSize=100`);

    assert.equal(res.result.pagination.total, 9);
  });
});
