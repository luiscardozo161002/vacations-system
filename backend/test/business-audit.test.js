require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');
const { clientIp } = require('../src/lib/client-ip');

const PASSWORD = 'Vacaciones2026!';
const RH_USER_ID = 2;
const EMPLOYEE_USER_ID = 4;

let server;
const tokens = {};

const login = async (email) => {
  const res = await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: PASSWORD } });
  return res.result.accessToken;
};

const call = (role, method, url, payload) =>
  server.inject({
    method,
    url: `/api/v1${url}`,
    payload,
    headers: { authorization: `Bearer ${tokens[role]}`, 'user-agent': 'pruebas' },
  });

const lastEvent = (eventType) => db('auth_audit_log').where('event_type', eventType).orderBy('log_id', 'desc').first();

before(async () => {
  await db.seed.run();
  server = await createServer();
  await server.initialize();
  tokens.SUPERUSER = await login('sysadmin@grupo-jo.com');
  tokens.USER = await login('r.jimenez@thh.com.mx');
  tokens.EMPLOYEE = await login('j.perez@jo.com.mx');
});

after(async () => {
  await db.seed.run();
  await server.stop();
  await db.destroy();
});

describe('Auditoría de avisos', () => {
  it('registra quién aprueba, qué aviso y desde dónde', async () => {
    const created = await call('EMPLOYEE', 'POST', '/notices', {
      employee_id: 1,
      reason_id: 1,
      absence_start_date: '2027-06-01',
      absence_end_date: '2027-06-01',
    });

    const res = await call('USER', 'POST', `/notices/${created.result.notice_id}/approve`);
    const event = await lastEvent('NOTICE_APPROVED');

    assert.equal(res.statusCode, 200);
    assert.equal(event.user_id, RH_USER_ID);
    assert.equal(event.result, 'success');
    assert.equal(event.entity, 'notice');
    assert.equal(event.entity_id, String(created.result.notice_id));
    assert.equal(event.ip_address, '127.0.0.1');
    assert.equal(event.user_agent, 'pruebas');
    assert.ok(event.request_id);
  });

  it('registra el intento fallido con el motivo', async () => {
    const approved = await lastEvent('NOTICE_APPROVED');

    const res = await call('USER', 'POST', `/notices/${approved.entity_id}/approve`);
    const event = await lastEvent('NOTICE_APPROVED');

    assert.equal(res.statusCode, 409);
    assert.equal(event.result, 'failed');
    assert.equal(event.metadata.error, 'INVALID_TRANSITION');
  });

  it('registra también el intento sin permiso', async () => {
    const res = await call('EMPLOYEE', 'POST', '/notices/1/reject');
    const event = await lastEvent('NOTICE_REJECTED');

    assert.equal(res.statusCode, 403);
    assert.equal(event.user_id, EMPLOYEE_USER_ID);
    assert.equal(event.result, 'failed');
    assert.equal(event.entity_id, '1');
  });
});

describe('Auditoría de empleados, reglas, usuarios y permisos', () => {
  it('registra el alta del empleado con el id nuevo y los datos enviados', async () => {
    const res = await call('USER', 'POST', '/employees', {
      department_id: 1,
      shift_id: 2,
      folio: 'AUD-1',
      employee_number: 'AUD-001',
      employee_name: 'Empleado Auditado',
      start_date: '2026-11-01',
    });
    const event = await lastEvent('EMPLOYEE_CREATED');

    assert.equal(event.entity_id, String(res.result.employee_id));
    assert.equal(event.metadata.changes.employee_number, 'AUD-001');
  });

  it('registra la baja del empleado', async () => {
    const created = await lastEvent('EMPLOYEE_CREATED');

    await call('USER', 'DELETE', `/employees/${created.entity_id}`);
    const event = await lastEvent('EMPLOYEE_DEACTIVATED');

    assert.equal(event.entity_id, created.entity_id);
    assert.equal(event.result, 'success');
  });

  it('nunca guarda contraseñas en el detalle', async () => {
    await call('SUPERUSER', 'POST', '/users', {
      role_id: 3,
      username: 'auditado',
      email: 'auditado@jo.com.mx',
      password: 'NoDebeVerse2026',
    });
    const event = await lastEvent('USER_CREATED');

    assert.equal(event.metadata.changes.username, 'auditado');
    assert.equal(event.metadata.changes.password, undefined);
    assert.doesNotMatch(JSON.stringify(event.metadata), /NoDebeVerse2026/);
  });

  it('registra cambios de reglas y de permisos', async () => {
    const rule = await call('SUPERUSER', 'POST', '/vacation-accrual-rules', {
      years_from: 60,
      years_to: 65,
      vacation_days: 40,
      effective_year: 2027,
    });
    const usersView = await db('permissions').where('permission_code', 'users:view').first('permission_id');
    const grant = await call('SUPERUSER', 'POST', '/role-permissions', { role_id: 2, permission_id: usersView.permission_id });
    const revoke = await call('SUPERUSER', 'DELETE', `/role-permissions/2/${usersView.permission_id}`);

    assert.equal((await lastEvent('RULE_CREATED')).entity_id, String(rule.result.rule_id));
    assert.equal(grant.statusCode, 201);
    assert.equal((await lastEvent('PERMISSION_GRANTED')).metadata.changes.permission_id, usersView.permission_id);
    assert.equal(revoke.statusCode, 204);
    assert.equal((await lastEvent('PERMISSION_REVOKED')).entity_id, '2');
  });
});

describe('GET /auth-audit-log', () => {
  it('filtra por resultado y trae el nombre del usuario', async () => {
    const res = await call('SUPERUSER', 'GET', '/auth-audit-log?result=failed&event_type=NOTICE_APPROVED');

    assert.ok(res.result.data.length > 0);
    assert.ok(res.result.data.every((entry) => entry.result === 'failed'));
    assert.equal(res.result.data[0].username, 'r.jimenez');
    assert.equal(res.result.data[0].entity, 'notice');
  });

  it('el login fallido sigue registrándose como fallido', async () => {
    await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'j.perez@jo.com.mx', password: 'equivocada' },
    });
    const event = await lastEvent('LOGIN_FAILED');

    assert.equal(event.result, 'failed');
    assert.equal(event.user_id, EMPLOYEE_USER_ID);
  });
});

describe('IP real del usuario', () => {
  const request = (remoteAddress, forwarded) => ({
    info: { remoteAddress },
    headers: forwarded ? { 'x-forwarded-for': forwarded } : {},
  });

  it('ignora X-Forwarded-For si la petición no viene de un proxy de confianza', () => {
    assert.equal(clientIp(request('203.0.113.9', '10.0.0.1'), []), '203.0.113.9');
  });

  it('detrás de un proxy de confianza toma la última IP que no es del proxy', () => {
    assert.equal(clientIp(request('10.0.0.2', '198.51.100.7, 10.0.0.2'), ['10.0.0.2']), '198.51.100.7');
    assert.equal(clientIp(request('10.0.0.2', '6.6.6.6, 198.51.100.7'), ['10.0.0.2']), '198.51.100.7');
  });

  it('quita el prefijo de IPv4 dentro de IPv6', () => {
    assert.equal(clientIp(request('::ffff:192.168.1.20'), []), '192.168.1.20');
  });
});
