'use strict';

const repository = require('./repository');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');
const { allowsBranch, allowsEmployee } = require('../../lib/data-scope');

const pick = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const checkReferences = async (data, scope) => {
  if (data.branch_id !== undefined && !(await allowsBranch(scope, data.branch_id))) {
    throw new AppError('INVALID_BRANCH', 'La sede no existe');
  }
  if (data.manager_employee_id != null && !(await allowsEmployee(scope, data.manager_employee_id))) {
    throw new AppError('INVALID_MANAGER', 'El empleado asignado como responsable no existe');
  }
};

const list = (filters, scope) => repository.list(filters, scope);

const findById = async (departmentId, scope) => {
  const department = await repository.findById(departmentId, scope);
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return department;
};

const create = async (data, scope) => {
  await checkReferences(data, scope);
  return repository.create(pick(data));
};

const update = async (departmentId, data, scope) => {
  await checkReferences(data, scope);
  const department = await repository.update(departmentId, pick(data), scope);
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return department;
};

const remove = async (departmentId, scope) => {
  const department = await repository.remove(departmentId, scope);
  if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'El departamento no existe');
  return department;
};

module.exports = { list, findById, create, update, remove };
