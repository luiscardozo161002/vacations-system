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

const search = async (role, text) => {
  const res = await server.inject({
    url: `/api/v1/employees?search=${encodeURIComponent(text)}`,
    headers: { authorization: `Bearer ${tokens[role]}` },
  });
  return res.result.data.map((employee) => employee.employee_name);
};

const VALID_EMPLOYEE = {
  department_id: 1,
  shift_id: 2,
  employee_number: '7001',
  employee_name: 'Valeria Ortega Díaz',
  start_date: '2026-01-15',
};

const create = (payload, role = 'SUPERUSER') =>
  server.inject({
    method: 'POST',
    url: '/api/v1/employees',
    payload,
    headers: { authorization: `Bearer ${tokens[role]}` },
  });

const tomorrow = () => new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

describe('POST /employees validaciones', () => {
  const rejects = async (changes, message) => {
    const res = await create({ ...VALID_EMPLOYEE, ...changes });

    assert.equal(res.statusCode, 400);
    assert.match(res.result.error.message, message);
  };

  it('no acepta el campo folio', async () => {
    await rejects({ folio: '01' }, /folio no está permitido/);
  });

  it('exige que el número de empleado tenga exactamente 4 dígitos', async () => {
    await rejects({ employee_number: 'EMP-1' }, /exactamente 4 dígitos/);
    await rejects({ employee_number: '123' }, /exactamente 4 dígitos/);
    await rejects({ employee_number: '12345' }, /exactamente 4 dígitos/);
    await rejects({ employee_number: '' }, /Escribe el número de empleado/);
  });

  it('valida el largo y los caracteres del nombre', async () => {
    await rejects({ employee_name: 'Al' }, /al menos 3 caracteres/);
    await rejects({ employee_name: 'A'.repeat(151) }, /máximo 150 caracteres/);
    await rejects({ employee_name: 'Luis 4545' }, /solo admite letras/);
    await rejects({ employee_name: '   ' }, /Escribe el nombre completo/);
  });

  it('rechaza una fecha de ingreso posterior a hoy', async () => {
    await rejects({ start_date: tomorrow() }, /no puede ser posterior a hoy/);
    await rejects({ start_date: '2026-02-30' }, /fecha debe ser válida/);
  });

  it('la fecha de nacimiento es opcional y debe dar entre 15 y 100 años', async () => {
    const year = new Date().getFullYear();

    await rejects({ birth_date: `${year - 10}-06-15` }, /entre 15 y 100 años/);
    await rejects({ birth_date: `${year - 120}-06-15` }, /entre 15 y 100 años/);
    await rejects({ birth_date: '1990-02-30' }, /fecha debe ser válida/);
    assert.equal((await create({ ...VALID_EMPLOYEE, employee_number: '7002', birth_date: '1990-06-15' })).statusCode, 201);
    assert.equal((await create({ ...VALID_EMPLOYEE, employee_number: '7003', employee_name: 'Sin Fecha Nacimiento' })).statusCode, 201);
  });

  it('valida el correo', async () => {
    await rejects({ email: 'sin-arroba' }, /correo electrónico no es válido/);
  });

  it('exige departamento y turno existentes', async () => {
    await rejects({ department_id: 'abc' }, /Selecciona un departamento/);
    await rejects({ shift_id: undefined }, /Selecciona un turno/);
    assert.equal((await create({ ...VALID_EMPLOYEE, department_id: 9999 })).statusCode, 422);
    assert.equal((await create({ ...VALID_EMPLOYEE, shift_id: 9999 })).statusCode, 422);
  });

  it('aplica las mismas reglas al actualizar', async () => {
    const res = await server.inject({
      method: 'PATCH',
      url: '/api/v1/employees/1',
      payload: { employee_number: 'ABCD' },
      headers: { authorization: `Bearer ${tokens.SUPERUSER}` },
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.result.error.message, /exactamente 4 dígitos/);
  });
});

describe('GET /employees?search', () => {
  it('busca por parte del nombre sin importar mayúsculas', async () => {
    assert.deepEqual(await search('SUPERUSER', 'PEREZ'), ['Juan Perez Lopez']);
  });

  it('busca por número de empleado', async () => {
    assert.deepEqual(await search('SUPERUSER', '0012'), ['Sofia Hernandez Paredes']);
  });

  it('respeta las sedes del usuario', async () => {
    assert.deepEqual(await search('SUPERUSER', 'Laura'), ['Laura Sanchez Ortiz']);
    assert.deepEqual(await search('USER', 'Laura'), []);
  });
});
