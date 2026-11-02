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

const findById = async (permissionId) => {
  const permission = await repository.findById(permissionId);
  if (!permission) throw new AppError('PERMISSION_NOT_FOUND', 'El permiso no existe');
  return permission;
};

const create = (data) => repository.create(pick(data));

const update = async (permissionId, data) => {
  const permission = await repository.update(permissionId, pick(data));
  if (!permission) throw new AppError('PERMISSION_NOT_FOUND', 'El permiso no existe');
  return permission;
};

const remove = async (permissionId) => {
  const permission = await repository.remove(permissionId);
  if (!permission) throw new AppError('PERMISSION_NOT_FOUND', 'El permiso no existe');
  return permission;
};

module.exports = { list, findById, create, update, remove };
