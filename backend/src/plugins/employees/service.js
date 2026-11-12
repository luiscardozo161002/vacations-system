'use strict';

const repository = require('./repository');
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

const findById = async (employeeId, scope) => {
  const employee = await repository.findById(employeeId, scope);
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'El empleado no existe');
  return employee;
};

const create = async (data, scope) => {
  await checkReferences(data, scope);
  return repository.create(pick(data));
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

module.exports = { list, findById, create, update, remove };
