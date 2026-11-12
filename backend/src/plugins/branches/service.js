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

const list = (filters, scope) => repository.list(filters, scope);

const findById = async (branchId, scope) => {
  const branch = await repository.findById(branchId, scope);
  if (!branch) throw new AppError('BRANCH_NOT_FOUND', 'La sede no existe');
  return branch;
};

const create = (data) => repository.create(pick(data));

const update = async (branchId, data, scope) => {
  const branch = await repository.update(branchId, pick(data), scope);
  if (!branch) throw new AppError('BRANCH_NOT_FOUND', 'La sede no existe');
  return branch;
};

const remove = async (branchId, scope) => {
  const branch = await repository.remove(branchId, scope);
  if (!branch) throw new AppError('BRANCH_NOT_FOUND', 'La sede no existe');
  return branch;
};

module.exports = { list, findById, create, update, remove };
