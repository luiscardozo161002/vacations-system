require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createServer = require('../src/server');
const db = require('../src/db');
const { longDate, absenceLines } = require('../src/plugins/notices/pdf');

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
  tokens.USER = await login('r.jimenez@thh.com.mx');
  tokens.EMPLOYEE = await login('j.perez@jo.com.mx');
});

after(async () => {
  await server.stop();
  await db.destroy();
});

const pdf = (role, noticeId) =>
  server.inject({ url: `/api/v1/notices/${noticeId}/pdf`, headers: { authorization: `Bearer ${tokens[role]}` } });

const noticeOf = (employeeId, status) => db('notices').where({ employee_id: employeeId, status }).first('notice_id');

describe('Formato del PDF', () => {
  it('escribe las fechas como en el formato de RH', () => {
    assert.equal(longDate('2025-09-09'), '09-septiembre-2025');
    assert.equal(longDate('2026-11-01', true), '01-Noviembre-2026');
  });

  it('pone un renglón de días y otro de horas solo cuando aplican', () => {
    const days = { absence_start_date: '2026-11-01', absence_end_date: '2026-11-03', days_taken: 3, hours_taken: 0 };
    const hours = {
      absence_start_date: '2026-11-04',
      absence_end_date: '2026-11-04',
      absence_start_time: '13:00:00',
      absence_end_time: '14:00:00',
      days_taken: 0,
      hours_taken: 1,
    };

    assert.deepEqual(absenceLines(days), ['DÍAS   Del 01-Noviembre-2026 al 03-Noviembre-2026, Número de Días: 3']);
    assert.deepEqual(absenceLines(hours), ['HORAS   de las 13:00 a las 14:00 hrs, Número de Horas: 1']);
    assert.equal(absenceLines({ ...days, hours_taken: 2, absence_start_time: '13:00', absence_end_time: '15:00' }).length, 2);
  });
});

describe('GET /notices/{id}/pdf', () => {
  it('el empleado descarga el PDF de su aviso aprobado', async () => {
    const { notice_id: noticeId } = await noticeOf(1, 'approved');
    const res = await pdf('EMPLOYEE', noticeId);

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'application/pdf');
    assert.match(res.headers['content-disposition'], new RegExp(`aviso-${noticeId}\\.pdf`));
    assert.equal(res.rawPayload.subarray(0, 5).toString(), '%PDF-');
  });

  it('no hay PDF de una solicitud pendiente', async () => {
    const { notice_id: noticeId } = await noticeOf(2, 'pending');
    const res = await pdf('USER', noticeId);

    assert.equal(res.statusCode, 409);
    assert.equal(res.result.error.code, 'NOTICE_NOT_APPROVED');
  });

  it('respeta el alcance: el empleado no descarga avisos de otros', async () => {
    const { notice_id: noticeId } = await noticeOf(12, 'approved');

    assert.equal((await pdf('EMPLOYEE', noticeId)).statusCode, 404);
    assert.equal((await pdf('USER', noticeId)).statusCode, 200);
  });
});
