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

const listedIds = async (role) => {
  const res = await server.inject({ url: '/api/v1/employees?pageSize=100', headers: { authorization: `Bearer ${tokens[role]}` } });
  return res.result.data.map((employee) => employee.employee_id);
};

const placeOf = async (employeeIds) => {
  const rows = await db('employees as e')
    .join('departments as d', 'd.department_id', 'e.department_id')
    .join('branches as b', 'b.branch_id', 'd.branch_id')
    .join('company as c', 'c.company_id', 'b.company_id')
    .whereIn('e.employee_id', employeeIds)
    .select('e.employee_id', 'c.folio', 'b.branch_name as state', 'e.employee_number');
  const byId = new Map(rows.map((row) => [row.employee_id, row]));
  return employeeIds.map((id) => byId.get(id));
};

const COMPANY_FIRST = (row) => [row.folio, row.state, row.employee_number];
const STATE_FIRST = (row) => [row.state, row.folio, row.employee_number];

const isOrdered = (places, key) =>
  places.every((place, index) => index === 0 || key(places[index - 1]).join('|') <= key(place).join('|'));

describe('GET /employees orden', () => {
  it('el superusuario ve por empresa, luego por estado de la sede y luego por número', async () => {
    const places = await placeOf(await listedIds('SUPERUSER'));

    assert.ok(places.length > 1);
    assert.ok(isOrdered(places, COMPANY_FIRST));
    assert.deepEqual(
      [...new Set(places.map((place) => place.folio))],
      [...new Set(places.map((place) => place.folio))].sort(),
    );
  });

  it('quien tiene sedes a cargo ve solo las suyas, por estado de la sede y luego por número', async () => {
    const places = await placeOf(await listedIds('USER'));

    assert.ok(places.length > 0);
    assert.ok(isOrdered(places, STATE_FIRST));
  });
});
