require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');

const PASSWORD = 'Vacaciones2026!';

let server;
let token;

const get = (url) => server.inject({ url, headers: { authorization: `Bearer ${token}` } });

before(async () => {
  await db.seed.run();
  server = await createServer();
  await server.initialize();
  const res = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'sysadmin@grupo-jo.com', password: PASSWORD },
  });
  token = res.result.accessToken;
});

after(async () => {
  await server.stop();
  await db.destroy();
});

describe('filtros con varios valores', () => {
  it('status=pending,approved trae los dos estados', async () => {
    const res = await get('/api/v1/notices?status=pending,approved&pageSize=100');
    const expected = await db('notices').whereIn('status', ['pending', 'approved']).count('* as total').first();

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.pagination.total, Number(expected.total));
    assert.deepEqual([...new Set(res.result.data.map((notice) => notice.status))].sort(), ['approved', 'pending']);
  });

  it('acepta el parámetro repetido igual que separado por comas', async () => {
    const commas = await get('/api/v1/notices?status=rejected,cancelled');
    const repeated = await get('/api/v1/notices?status=rejected&status=cancelled');

    assert.equal(repeated.statusCode, 200);
    assert.equal(repeated.result.pagination.total, commas.result.pagination.total);
  });

  it('un solo valor sigue funcionando', async () => {
    const res = await get('/api/v1/notices?status=rejected');

    assert.ok(res.result.data.length > 0);
    assert.ok(res.result.data.every((notice) => notice.status === 'rejected'));
  });

  it('filtra empleados por varios departamentos', async () => {
    const res = await get('/api/v1/employees?department_id=1,2&pageSize=100');
    const expected = await db('employees').whereIn('department_id', [1, 2]).count('* as total').first();

    assert.equal(res.result.pagination.total, Number(expected.total));
    assert.ok(res.result.data.every((employee) => [1, 2].includes(employee.department_id)));
  });

  it('filtra usuarios por varios estados', async () => {
    const res = await get('/api/v1/users?status=active,locked&pageSize=100');

    assert.equal(res.statusCode, 200);
    assert.ok(res.result.data.every((user) => ['active', 'locked'].includes(user.status)));
  });

  it('rechaza un valor que no existe dentro de la lista', async () => {
    const res = await get('/api/v1/notices?status=pending,archived');

    assert.equal(res.statusCode, 400);
    assert.match(res.result.error.message, /debe ser uno de/);
  });
});

describe('rangos de fecha', () => {
  it('filtra empleados por fecha de ingreso', async () => {
    const res = await get('/api/v1/employees?hired_from=2015-01-01&hired_to=2020-12-31&pageSize=100');
    const expected = await db('employees').whereBetween('start_date', ['2015-01-01', '2020-12-31']).count('* as total').first();

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.pagination.total, Number(expected.total));
  });

  it('filtra la auditoría por día, incluyendo el día final completo', async () => {
    const [inside, outside] = await db('auth_audit_log')
      .insert([
        { event_type: 'LOGIN', result: 'success', created_at: '2026-03-10T23:30:00' },
        { event_type: 'LOGIN', result: 'success', created_at: '2026-03-11T00:30:00' },
      ])
      .returning('log_id');

    const res = await get('/api/v1/auth-audit-log?from=2026-03-01&to=2026-03-10&event_type=LOGIN,LOGOUT');
    const ids = res.result.data.map((entry) => entry.log_id);

    assert.equal(res.statusCode, 200);
    assert.ok(ids.includes(inside.log_id));
    assert.ok(!ids.includes(outside.log_id));
  });

  it('rechaza fechas con otro formato', async () => {
    const res = await get('/api/v1/auth-audit-log?from=10/03/2026');

    assert.equal(res.statusCode, 400);
    assert.match(res.result.error.message, /AAAA-MM-DD/);
  });
});
