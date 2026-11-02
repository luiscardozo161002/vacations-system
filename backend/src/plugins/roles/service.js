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

const findById = async (roleId) => {
  const role = await repository.findById(roleId);
  if (!role) throw new AppError('ROLE_NOT_FOUND', 'El rol no existe');
  return role;
};

const create = (data) => repository.create(pick(data));

const update = async (roleId, data) => {
  const role = await repository.update(roleId, pick(data));
  if (!role) throw new AppError('ROLE_NOT_FOUND', 'El rol no existe');
  return role;
};

const remove = async (roleId) => {
  const role = await repository.remove(roleId);
  if (!role) throw new AppError('ROLE_NOT_FOUND', 'El rol no existe');
  return role;
};

module.exports = { list, findById, create, update, remove };
