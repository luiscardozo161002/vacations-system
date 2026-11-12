'use strict';

const repository = require('./repository');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');
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

const list = (filters, scope) => repository.list(filters, scope);

const findById = async (entitlementId, scope) => {
  const entitlement = await repository.findById(entitlementId, scope);
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return entitlement;
};

const create = async (data, scope) => {
  await checkReferences(data, scope);
  return repository.create(pick(data));
};

const update = async (entitlementId, data, scope) => {
  await checkReferences(data, scope);
  const entitlement = await repository.update(entitlementId, pick(data), scope);
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return entitlement;
};

const remove = async (entitlementId, scope) => {
  const entitlement = await repository.remove(entitlementId, scope);
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return entitlement;
};

module.exports = { list, findById, create, update, remove };
