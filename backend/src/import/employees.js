'use strict';

const { parse } = require('csv-parse/sync');
const db = require('../db');
const { rollover } = require('../plugins/vacation-entitlements/rollover');
const { grantAccess } = require('../plugins/employees/access');
const { toCsv } = require('../lib/csv');

const HEADERS = [
  'numero_empleado',
  'folio',
  'nombre',
  'fecha_ingreso',
  'sede',
  'departamento',
  'turno',
  'correo',
  'dias_usados',
  'horas_usadas',
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MX_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const simplify = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

const headerKey = (header) => simplify(header).replace(/\s+/g, '_');

const readRows = (content) => {
  const firstLine = content.split(/\r?\n/, 1)[0];
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  return parse(content, {
    bom: true,
    delimiter,
    columns: (headers) => headers.map(headerKey),
    skip_empty_lines: true,
    trim: true,
  });
};

const toIsoDate = (value) => {
  const iso = ISO_DATE.exec(value);
  const mx = MX_DATE.exec(value);
  const [year, month, day] = iso ? [iso[1], iso[2], iso[3]] : mx ? [mx[3], mx[2], mx[1]] : [];
  if (!year) return null;
  const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date ? date : null;
};

const toAmount = (value) => (value === '' || value === undefined ? 0 : Number(value.replace(',', '.')));

const loadCatalogs = async () => {
  const [branches, departments, shifts, accounts] = await Promise.all([
    db('branches').where('status', 'active').select('branch_id', 'code'),
    db('departments').where('status', 'active').select('department_id', 'branch_id', 'code', 'department_name'),
    db('shifts').where('status', 'active').select('shift_id', 'code', 'shift_name'),
    db('users as u').leftJoin('employees as e', 'e.employee_id', 'u.employee_id').select('u.email', 'e.employee_number'),
  ]);
  return { branches, departments, shifts, accounts };
};

const validate = (row, catalogs, today) => {
  const errors = [];
  const required = (field, label, max) => {
    if (!row[field]) errors.push(`Falta ${label}`);
    else if (row[field].length > max) errors.push(`${label} tiene más de ${max} caracteres`);
  };
  required('numero_empleado', 'el número de empleado', 20);
  required('folio', 'el folio', 10);
  required('nombre', 'el nombre', 150);

  const startDate = toIsoDate(row.fecha_ingreso ?? '');
  if (!startDate) errors.push('La fecha de ingreso debe ser AAAA-MM-DD o DD/MM/AAAA');
  else if (startDate > today) errors.push('La fecha de ingreso está en el futuro');

  const branch = catalogs.branches.find((item) => simplify(item.code) === simplify(row.sede));
  if (!branch) errors.push(`No existe la sede "${row.sede ?? ''}"`);

  const department =
    branch &&
    catalogs.departments.find(
      (item) =>
        item.branch_id === branch.branch_id &&
        [simplify(item.code), simplify(item.department_name)].includes(simplify(row.departamento)),
    );
  if (branch && !department) errors.push(`No existe el departamento "${row.departamento ?? ''}" en la sede ${branch.code}`);

  const shift = catalogs.shifts.find((item) =>
    [simplify(item.code), simplify(item.shift_name)].includes(simplify(row.turno)),
  );
  if (!shift) errors.push(`No existe el turno "${row.turno ?? ''}"`);

  const email = simplify(row.correo);
  if (email && (!EMAIL.test(email) || email.length > 120)) errors.push('El correo no es válido');
  const owner = email && catalogs.accounts.find((account) => simplify(account.email) === email);
  if (owner && owner.employee_number !== row.numero_empleado) errors.push('El correo ya lo usa otra cuenta');

  const usedDays = toAmount(row.dias_usados);
  const usedHours = toAmount(row.horas_usadas);
  if (!Number.isInteger(usedDays) || usedDays < 0) errors.push('Los días usados deben ser un número entero sin signo');
  if (Number.isNaN(usedHours) || usedHours < 0) errors.push('Las horas usadas deben ser un número sin signo');

  if (errors.length) return { errors };
  return {
    employee: {
      employee_number: row.numero_empleado,
      folio: row.folio,
      employee_name: row.nombre,
      start_date: startDate,
      department_id: department.department_id,
      shift_id: shift.shift_id,
      status: 'active',
    },
    email: email || null,
    usedDays,
    usedHours,
  };
};

const saveEmployee = async (employee) => {
  const existing = await db('employees').where('employee_number', employee.employee_number).first('employee_id');
  if (existing) {
    await db('employees').where('employee_id', existing.employee_id).update({ ...employee, updated_at: db.fn.now() });
    return { employeeId: existing.employee_id, created: false };
  }
  const [row] = await db('employees').insert(employee).returning('employee_id');
  return { employeeId: row.employee_id, created: true };
};

const saveBalance = async (employeeId, { usedDays, usedHours }, today) => {
  const entitlement = await db('vacation_entitlements')
    .where('employee_id', employeeId)
    .where('period_start', '<=', today)
    .where('period_end', '>=', today)
    .first('entitlement_id', 'total_days');

  if (!entitlement) return usedDays || usedHours ? 'Sin periodo vigente (menos de un año): no se cargaron días usados' : null;
  if (usedDays > entitlement.total_days) return `Los días usados (${usedDays}) superan los ${entitlement.total_days} del periodo`;

  await db('vacation_entitlements')
    .where('entitlement_id', entitlement.entitlement_id)
    .update({ used_days: usedDays, used_hours: usedHours });
  return null;
};

const importEmployees = async (content, { simulate = false, createAccess = false } = {}) => {
  const rows = readRows(content);
  const missing = HEADERS.filter((header) => !(rows[0] && header in rows[0]));
  if (rows.length && missing.length) {
    throw new Error(`Faltan columnas en el archivo: ${missing.join(', ')}`);
  }

  const today = (await db.first(db.raw("to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today"))).today;
  const catalogs = await loadCatalogs();
  const seen = new Set();
  const report = rows.map((row, index) => {
    const line = index + 2;
    if (seen.has(row.numero_empleado)) {
      return { line, row, result: 'rechazado', detail: 'Número de empleado repetido en el archivo' };
    }
    seen.add(row.numero_empleado);
    const checked = validate(row, catalogs, today);
    return checked.errors
      ? { line, row, result: 'rechazado', detail: checked.errors.join('; ') }
      : { line, row, result: 'valido', detail: '', checked };
  });

  if (simulate) return report;

  for (const entry of report.filter((item) => item.checked)) {
    try {
      const saved = await saveEmployee(entry.checked.employee);
      entry.employeeId = saved.employeeId;
      entry.result = saved.created ? 'creado' : 'actualizado';
    } catch (err) {
      entry.result = 'rechazado';
      entry.detail = err.message;
    }
  }

  await rollover(today);

  for (const entry of report.filter((item) => item.employeeId)) {
    const warning = await saveBalance(entry.employeeId, entry.checked, today);
    if (warning) entry.detail = warning;

    if (createAccess && entry.checked.email) {
      const account = await db('users').where('employee_id', entry.employeeId).first('username');
      if (account) {
        entry.username = account.username;
      } else {
        const access = await db.transaction((trx) => grantAccess(entry.employeeId, entry.checked.email, trx));
        entry.username = access.account.username;
        entry.temporaryPassword = access.temporary_password;
      }
    }
  }
  return report;
};

const REPORT_HEADERS = ['fila', 'numero_empleado', 'nombre', 'resultado', 'detalle', 'usuario', 'contrasena_temporal'];

const toReportCsv = (report) =>
  toCsv([
    REPORT_HEADERS,
    ...report.map((entry) => [
      entry.line,
      entry.row.numero_empleado,
      entry.row.nombre,
      entry.result,
      entry.detail,
      entry.username,
      entry.temporaryPassword,
    ]),
  ]);

module.exports = { HEADERS, importEmployees, toReportCsv };
