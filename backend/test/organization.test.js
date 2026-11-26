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

describe('Colores de empresas y sedes', () => {
  it('los departamentos traen la sede y la empresa con sus colores', async () => {
    const res = await call('USER', 'GET', `/departments/${EXPLOTACION}`);

    assert.equal(res.result.company_name, 'TRANSPORTES HIDRO HIDALGUENSES S.A. DE C.V.');
    assert.equal(res.result.company_folio, 'THH');
    assert.equal(res.result.company_color, '#16a34a');
    assert.equal(res.result.branch_color, null);
  });

  it('RH cambia el color de la empresa y de la sede y los dos persisten', async () => {
    const company = await call('USER', 'PATCH', `/companies/${THH}`, { color: '#9333ea' });
    const branch = await call('USER', 'PATCH', '/branches/5', { color: '#0ea5e9' });
    const department = await call('USER', 'GET', `/departments/${EXPLOTACION}`);
    await call('USER', 'PATCH', `/companies/${THH}`, { color: '#16a34a' });
    await call('USER', 'PATCH', '/branches/5', { color: null });

    assert.equal(company.statusCode, 200);
    assert.equal(company.result.color, '#9333ea');
    assert.equal(branch.result.color, '#0ea5e9');
    assert.equal(department.result.company_color, '#9333ea');
    assert.equal(department.result.branch_color, '#0ea5e9');
  });

  it('las sedes traen la empresa a la que pertenecen', async () => {
    const res = await call('USER', 'GET', '/branches/5');

    assert.equal(res.result.company_folio, 'THH');
    assert.equal(res.result.company_color, '#16a34a');
  });

  it('rechaza un color que no es #RRGGBB', async () => {
    const res = await call('SUPERUSER', 'PATCH', `/companies/${THH}`, { color: 'rojo' });

    assert.equal(res.statusCode, 400);
    assert.match(res.result.error.message, /#RRGGBB/);
  });
});

describe('Alta, edición y baja de empresas y sedes', () => {
  const created = { companies: [], branches: [] };

  after(async () => {
    await db('branches').whereIn('branch_id', created.branches).del();
    await db('company').whereIn('company_id', created.companies).del();
  });

  const newCompany = (extra = {}) => ({
    folio: 'tst',
    company_name: 'Empresa de Prueba SA de CV',
    rfc: 'tst010101ab1',
    phone_number: '771 000 0000',
    location: 'Calle 1, Pachuca',
    logo: 'https://example.com/logo.png',
    ...extra,
  });

  it('el Superusuario da de alta una empresa y el folio y el RFC se guardan en mayúsculas', async () => {
    const res = await call('SUPERUSER', 'POST', '/companies', newCompany());
    created.companies.push(res.result.company_id);

    assert.equal(res.statusCode, 201);
    assert.equal(res.result.folio, 'TST');
    assert.equal(res.result.rfc, 'TST010101AB1');
    assert.equal(res.result.status, 'active');
  });

  it('rechaza folio o RFC repetidos con un mensaje claro', async () => {
    const dupFolio = await call('SUPERUSER', 'POST', '/companies', newCompany({ rfc: null }));
    const dupRfc = await call('SUPERUSER', 'POST', '/companies', newCompany({ folio: 'TS2' }));

    assert.equal(dupFolio.statusCode, 409);
    assert.equal(dupFolio.result.error.code, 'COMPANY_FOLIO_EXISTS');
    assert.equal(dupRfc.statusCode, 409);
    assert.equal(dupRfc.result.error.code, 'COMPANY_RFC_EXISTS');
  });

  it('valida cada campo de la empresa con su propio mensaje', async () => {
    const send = (extra) => call('SUPERUSER', 'POST', '/companies', newCompany({ folio: 'VAL', rfc: null, ...extra }));

    assert.match((await send({ folio: 'con espacio' })).result.error.message, /folio solo admite letras y números/);
    assert.match((await send({ company_name: 'AB' })).result.error.message, /al menos 3 caracteres/);
    assert.match((await send({ rfc: '123' })).result.error.message, /RFC no es válido/);
    assert.match((await send({ logo: 'logo.png' })).result.error.message, /dirección web/);
  });

  it('edita la empresa y deja en blanco los datos opcionales', async () => {
    const id = created.companies[0];
    const res = await call('SUPERUSER', 'PATCH', `/companies/${id}`, { company_name: 'Otra Razón SA', phone_number: '', logo: '' });

    assert.equal(res.statusCode, 200);
    assert.equal(res.result.company_name, 'Otra Razón SA');
    assert.equal(res.result.phone_number, null);
    assert.equal(res.result.logo, null);
  });

  it('da de alta una sede, la valida y no deja repetir el código', async () => {
    const company_id = created.companies[0];
    const ok = await call('SUPERUSER', 'POST', '/branches', { company_id, code: 'tst_one', branch_name: 'Sede Uno' });
    created.branches.push(ok.result.branch_id);
    const dup = await call('SUPERUSER', 'POST', '/branches', { company_id, code: 'TST_ONE', branch_name: 'Otra' });
    const bad = await call('SUPERUSER', 'POST', '/branches', { company_id, code: 'a b', branch_name: 'Mala' });

    assert.equal(ok.statusCode, 201);
    assert.equal(ok.result.code, 'TST_ONE');
    assert.equal(dup.statusCode, 409);
    assert.equal(dup.result.error.code, 'BRANCH_CODE_EXISTS');
    assert.equal(bad.statusCode, 400);
    assert.match(bad.result.error.message, /código solo admite/);
  });

  it('una sede no cambia de empresa', async () => {
    const res = await call('SUPERUSER', 'PATCH', `/branches/${created.branches[0]}`, { company_id: 1 });

    assert.equal(res.statusCode, 422);
    assert.equal(res.result.error.code, 'INVALID_COMPANY');
  });

  it('no se da de baja una empresa con sedes activas ni una sede con departamentos activos', async () => {
    const company_id = created.companies[0];
    const branch_id = created.branches[0];
    const department = await call('SUPERUSER', 'POST', '/departments', { branch_id, code: 'TD1', department_name: 'Depto Prueba' });

    const companyBlocked = await call('SUPERUSER', 'DELETE', `/companies/${company_id}`);
    const branchBlocked = await call('SUPERUSER', 'DELETE', `/branches/${branch_id}`);
    await db('departments').where('department_id', department.result.department_id).del();
    const branchOff = await call('SUPERUSER', 'DELETE', `/branches/${branch_id}`);
    const companyOff = await call('SUPERUSER', 'DELETE', `/companies/${company_id}`);

    assert.equal(companyBlocked.result.error.code, 'COMPANY_HAS_BRANCHES');
    assert.equal(branchBlocked.result.error.code, 'BRANCH_HAS_DEPARTMENTS');
    assert.equal(branchOff.statusCode, 204);
    assert.equal(companyOff.statusCode, 204);
    assert.equal((await call('SUPERUSER', 'GET', `/companies/${company_id}`)).result.status, 'inactive');
  });

  it('no se crea ni reactiva una sede dentro de una empresa dada de baja', async () => {
    const company_id = created.companies[0];
    const create = await call('SUPERUSER', 'POST', '/branches', { company_id, code: 'TST_TWO', branch_name: 'Sede Dos' });
    const reactivate = await call('SUPERUSER', 'PATCH', `/branches/${created.branches[0]}`, { status: 'active' });
    const company = await call('SUPERUSER', 'PATCH', `/companies/${company_id}`, { status: 'active' });
    const afterCompany = await call('SUPERUSER', 'PATCH', `/branches/${created.branches[0]}`, { status: 'active' });

    assert.equal(create.result.error.code, 'INVALID_COMPANY');
    assert.equal(reactivate.result.error.code, 'INVALID_COMPANY');
    assert.equal(company.result.status, 'active');
    assert.equal(afterCompany.result.status, 'active');
  });

  it('RH puede cambiar el color pero no el resto de los datos ni crear empresas', async () => {
    const id = created.companies[0];
    const color = await call('USER', 'PATCH', `/companies/${THH}`, { color: '#16a34a' });
    const name = await call('USER', 'PATCH', `/companies/${THH}`, { company_name: 'Cambiada' });
    const status = await call('USER', 'PATCH', `/branches/5`, { status: 'inactive' });
    const create = await call('USER', 'POST', '/companies', newCompany({ folio: 'RH1', rfc: null }));

    assert.equal(color.statusCode, 200);
    assert.equal(name.statusCode, 403);
    assert.equal(status.statusCode, 403);
    assert.equal(create.statusCode, 403);
    assert.ok(id);
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
