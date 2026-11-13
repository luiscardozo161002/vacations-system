require('./env');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/db');
const { importEmployees, toReportCsv } = require('../src/import/employees');

const HEADER = 'numero_empleado,folio,nombre,fecha_ingreso,sede,departamento,turno,correo,dias_usados,horas_usadas';

const csv = (...rows) => [HEADER, ...rows].join('\r\n');

const VALID = 'IMP-001,I001,Laura Hernández Ruiz,15/03/2019,THH_HGO,Explotacion,Operaciones,l.hernandez@thh.com.mx,4,2';

const balanceOf = (employeeNumber) =>
  db('vacation_entitlements as v')
    .join('employees as e', 'e.employee_id', 'v.employee_id')
    .where('e.employee_number', employeeNumber)
    .whereRaw('v.period_start <= CURRENT_DATE AND v.period_end >= CURRENT_DATE')
    .first('v.used_days', 'v.used_hours', 'v.total_days');

before(async () => {
  await db.seed.run();
});

after(async () => {
  await db.seed.run();
  await db.destroy();
});

describe('Validación del archivo', () => {
  it('la simulación reporta cada fila rechazada con su motivo y no guarda nada', async () => {
    const report = await importEmployees(
      csv(
        VALID,
        'IMP-002,I002,Sin Sede,2020-01-10,XXX,Explotacion,Operaciones,,0,0',
        'IMP-003,I003,Sin Depto,2020-01-10,THH_HGO,Ventas,Operaciones,,0,0',
        'IMP-004,I004,Mala Fecha,31/02/2020,THH_HGO,EXP,OPERACIONES,,0,0',
        'IMP-005,I005,Correo Ajeno,2020-01-10,THH_HGO,EXP,Oficinas,j.perez@jo.com.mx,0,0',
        'IMP-001,I006,Repetido,2020-01-10,THH_HGO,EXP,Oficinas,,0,0',
      ),
      { simulate: true },
    );

    assert.deepEqual(
      report.map((entry) => entry.result),
      ['valido', 'rechazado', 'rechazado', 'rechazado', 'rechazado', 'rechazado'],
    );
    assert.match(report[1].detail, /No existe la sede "XXX"/);
    assert.match(report[2].detail, /No existe el departamento "Ventas" en la sede THH_HGO/);
    assert.match(report[3].detail, /fecha de ingreso/);
    assert.match(report[4].detail, /El correo ya lo usa otra cuenta/);
    assert.match(report[5].detail, /repetido/);
    assert.equal(await db('employees').where('employee_number', 'IMP-001').first(), undefined);
  });

  it('acepta punto y coma, encabezados con acentos o mayúsculas y la marca BOM de Excel', async () => {
    const content = `\uFEFF${HEADER.toUpperCase().replace(/,/g, ';')}\r\n${VALID.replace(/,/g, ';')}`;
    const [entry] = await importEmployees(content, { simulate: true });
    assert.equal(entry.result, 'valido');
  });

  it('avisa si faltan columnas', async () => {
    await assert.rejects(importEmployees('numero_empleado,nombre\r\nX,Y'), /Faltan columnas en el archivo: folio/);
  });
});

describe('Importación', () => {
  it('da de alta al empleado, abre su periodo y carga los días usados', async () => {
    const [entry] = await importEmployees(csv(VALID));
    const employee = await db('employees').where('employee_number', 'IMP-001').first();
    const balance = await balanceOf('IMP-001');

    assert.equal(entry.result, 'creado');
    assert.equal(employee.start_date, '2019-03-15');
    assert.equal(employee.employee_name, 'Laura Hernández Ruiz');
    assert.equal(balance.used_days, 4);
    assert.equal(balance.used_hours, 2);
  });

  it('volver a correr el mismo archivo no duplica nada', async () => {
    const [entry] = await importEmployees(csv(VALID));

    assert.equal(entry.result, 'actualizado');
    assert.equal(Number((await db('employees').where('employee_number', 'IMP-001').count('* as total').first()).total), 1);
    assert.equal(Number((await balanceOf('IMP-001')).used_days), 4);
  });

  it('actualiza los datos que cambiaron', async () => {
    await importEmployees(csv(VALID.replace('Laura Hernández Ruiz', 'Laura Hernández Ríos').replace(',4,2', ',6,0')));

    assert.equal((await db('employees').where('employee_number', 'IMP-001').first()).employee_name, 'Laura Hernández Ríos');
    assert.equal((await balanceOf('IMP-001')).used_days, 6);
  });

  it('no carga días usados que superan el periodo', async () => {
    const [entry] = await importEmployees(csv(VALID.replace(',4,2', ',99,0')));

    assert.match(entry.detail, /Los días usados \(99\) superan los \d+ del periodo/);
    assert.equal((await balanceOf('IMP-001')).used_days, 6);
  });
});

describe('Accesos', () => {
  it('crea la cuenta con contraseña temporal una sola vez', async () => {
    const [first] = await importEmployees(csv(VALID), { createAccess: true });
    const [second] = await importEmployees(csv(VALID), { createAccess: true });

    assert.equal(first.username, 'l.hernandez');
    assert.equal(first.temporaryPassword.length, 10);
    assert.equal(second.username, 'l.hernandez');
    assert.equal(second.temporaryPassword, undefined);
    assert.match(toReportCsv([first]), /"l.hernandez","[A-Za-z0-9]{10}"$/);
  });
});
