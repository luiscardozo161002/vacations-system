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

const findById = async (employeeId) => {
  const employee = await repository.findById(employeeId);
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'El empleado no existe');
  return employee;
};

const create = (data) => repository.create(pick(data));

const update = async (employeeId, data) => {
  const employee = await repository.update(employeeId, pick(data));
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'El empleado no existe');
  return employee;
};

const remove = async (employeeId) => {
  const employee = await repository.remove(employeeId);
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'El empleado no existe');
  return employee;
};

module.exports = { list, findById, create, update, remove };
