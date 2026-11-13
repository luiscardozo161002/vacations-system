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

const download = (role, query = '') =>
  server.inject({ url: `/api/v1/employees/export${query}`, headers: { authorization: `Bearer ${tokens[role]}` } });

const lines = (res) => res.payload.replace(/^\uFEFF/, '').split('\r\n');

before(async () => {
  await db.seed.run();
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

describe('GET /employees/export', () => {
  it('descarga un CSV para Excel con los empleados de las sedes de RH', async () => {
    const res = await download('USER');
    const rows = lines(res);

    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'], /^text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename="empleados-\d{4}-\d{2}-\d{2}\.csv"/);
    assert.ok(res.payload.startsWith('\uFEFF'));
    assert.equal(rows[0], '"Número","Folio","Nombre","Sede","Departamento","Turno","Fecha de ingreso","Correo","Estado"');
    assert.ok(rows.slice(1).every((row) => row.includes('"THH_HGO"')));
    assert.ok(!res.payload.includes('Laura Sanchez Ortiz'));
  });

  it('respeta los filtros activos', async () => {
    const rows = lines(await download('SUPERUSER', '?search=perez&status=active'));

    assert.equal(rows.length, 2);
    assert.match(rows[1], /^"EMP-001","\d+","Juan Perez Lopez","THH_HGO","Explotacion","Operaciones","\d{2}\/\d{2}\/\d{4}","j.perez@jo.com.mx","Activo"$/);
  });

  it('queda en la auditoría con los filtros usados', async () => {
    await download('USER', '?status=inactive');
    const event = await db('auth_audit_log').where('event_type', 'EMPLOYEES_EXPORTED').orderBy('log_id', 'desc').first();

    assert.equal(event.user_id, 2);
    assert.deepEqual(event.metadata.changes, { status: 'inactive' });
  });

  it('el Empleado no puede exportar', async () => {
    assert.equal((await download('EMPLOYEE')).statusCode, 403);
  });
});
