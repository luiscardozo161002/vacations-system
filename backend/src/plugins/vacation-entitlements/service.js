'use strict';

const repository = require('./repository');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');
const { findEmployeeDetails } = require('../../lib/employee-details');
const { toTotalHours, splitHours } = require('../../lib/balance');
const { allowsEmployee } = require('../../lib/data-scope');

const pick = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const checkReferences = async (data, scope) => {
  if (data.employee_id !== undefined && !(await allowsEmployee(scope, data.employee_id))) {
    throw new AppError('INVALID_EMPLOYEE', 'El empleado no existe');
  }
};

const describeAll = async (entitlements) => {
  const employees = await findEmployeeDetails(entitlements.map((entitlement) => entitlement.employee_id));

  return entitlements.map((entitlement) => {
    const { daily_hours: dailyHours, ...employee } = employees.get(entitlement.employee_id) ?? { daily_hours: 8 };
    const used = toTotalHours(entitlement.used_days, entitlement.used_hours, dailyHours);
    return {
      ...entitlement,
      employee_name: employee.employee_name ?? null,
      employee_number: employee.employee_number ?? null,
      department_name: employee.department_name ?? null,
      daily_hours: dailyHours,
      available: splitHours(Math.max(0, entitlement.total_days * dailyHours - used), dailyHours),
    };
  });
};

const describe = async (entitlement) => (await describeAll([entitlement]))[0];

const list = async (filters, scope) => {
  const page = await repository.list(filters, scope);
  return { ...page, data: await describeAll(page.data) };
};

const findById = async (entitlementId, scope) => {
  const entitlement = await repository.findById(entitlementId, scope);
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return describe(entitlement);
};

const create = async (data, scope) => {
  await checkReferences(data, scope);
  return describe(await repository.create(pick(data)));
};

const update = async (entitlementId, data, scope) => {
  await checkReferences(data, scope);
  const entitlement = await repository.update(entitlementId, pick(data), scope);
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return describe(entitlement);
};

const remove = async (entitlementId, scope) => {
  const entitlement = await repository.remove(entitlementId, scope);
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return entitlement;
};

module.exports = { list, findById, create, update, remove };
