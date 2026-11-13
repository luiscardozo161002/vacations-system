'use strict';

const db = require('../../db');
const repository = require('./repository');
const { findAccount, grantAccess } = require('./access');
const { toCsv } = require('../../lib/csv');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');
const { allowsDepartment } = require('../../lib/data-scope');

const pick = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const checkReferences = async (data, scope) => {
  if (data.department_id !== undefined && !(await allowsDepartment(scope, data.department_id))) {
    throw new AppError('INVALID_DEPARTMENT', 'El departamento no existe');
  }
};

const list = (filters, scope) => repository.list(filters, scope);

const EXPORT_HEADERS = ['Número', 'Folio', 'Nombre', 'Sede', 'Departamento', 'Turno', 'Fecha de ingreso', 'Correo', 'Estado'];
const STATUS_LABELS = { active: 'Activo', inactive: 'Inactivo' };

const toMexicanDate = (iso) => iso.split('-').reverse().join('/');

const exportCsv = async (filters, scope) => {
  const rows = await repository.exportRows(filters, scope);
  return toCsv([
    EXPORT_HEADERS,
    ...rows.map((row) => [
      row.employee_number,
      row.folio,
      row.employee_name,
      row.branch_code,
      row.department_name,
      row.shift_name,
      toMexicanDate(row.start_date),
      row.email,
      STATUS_LABELS[row.status],
    ]),
  ]);
};

const findById = async (employeeId, scope) => {
  const employee = await repository.findById(employeeId, scope);
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'El empleado no existe');
  return { ...employee, account: (await findAccount(employeeId)) ?? null };
};

const create = async (data, scope) => {
  await checkReferences(data, scope);
  return db.transaction(async (trx) => {
    const employee = await repository.create(pick(data), trx);
    if (!data.email) return { ...employee, account: null };
    return { ...employee, ...(await grantAccess(employee.employee_id, data.email, trx)) };
  });
};

const resendAccess = async (employeeId, email, scope) => {
  const employee = await findById(employeeId, scope);
  if (employee.status !== 'active') {
    throw new AppError('EMPLOYEE_INACTIVE', 'El empleado está dado de baja; reactívalo antes de enviarle acceso');
  }
  return db.transaction((trx) => grantAccess(employeeId, email, trx));
};

const update = async (employeeId, data, scope) => {
  await checkReferences(data, scope);
  const employee = await repository.update(employeeId, pick(data), scope);
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'El empleado no existe');
  return employee;
};

const remove = async (employeeId, scope) => {
  const employee = await repository.remove(employeeId, scope);
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'El empleado no existe');
  return employee;
};

module.exports = { list, exportCsv, findById, create, update, remove, resendAccess };
