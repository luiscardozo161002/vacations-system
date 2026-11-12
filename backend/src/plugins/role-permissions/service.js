'use strict';

const repository = require('./repository');
const { AppError } = require('../../lib/app-error');

const list = (filters) => repository.list(filters);

const findById = async (roleId, permissionId) => {
  const rolePermission = await repository.findById(roleId, permissionId);
  if (!rolePermission) throw new AppError('ROLE_PERMISSION_NOT_FOUND', 'Ese permiso no está asignado a ese rol');
  return rolePermission;
};

const create = (data) => repository.create(data);

const remove = async (roleId, permissionId) => {
  const rolePermission = await repository.remove(roleId, permissionId);
  if (!rolePermission) throw new AppError('ROLE_PERMISSION_NOT_FOUND', 'Ese permiso no está asignado a ese rol');
  return rolePermission;
};

module.exports = { list, findById, create, remove };
