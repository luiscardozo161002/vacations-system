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

const findById = async (departmentId) => {
  const department = await repository.findById(departmentId);
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return department;
};

const create = (data) => repository.create(pick(data));

const update = async (departmentId, data) => {
  const department = await repository.update(departmentId, pick(data));
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return department;
};

const remove = async (departmentId) => {
  const department = await repository.remove(departmentId);
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return department;
};

module.exports = { list, findById, create, update, remove };
