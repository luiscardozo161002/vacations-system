'use strict';

const repository = require('./repository');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');

const pick = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const list = (filters) => repository.list(filters);

const findById = async (entitlementId) => {
  const entitlement = await repository.findById(entitlementId);
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return entitlement;
};

const create = (data) => repository.create(pick(data));

const update = async (entitlementId, data) => {
  const entitlement = await repository.update(entitlementId, pick(data));
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return entitlement;
};

const remove = async (entitlementId) => {
  const entitlement = await repository.remove(entitlementId);
  if (!entitlement) throw new AppError('VACATION_ENTITLEMENT_NOT_FOUND', 'El saldo de vacaciones no existe');
  return entitlement;
};

module.exports = { list, findById, create, update, remove };
