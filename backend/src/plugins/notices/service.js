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

const findById = async (noticeId, scope) => {
  const notice = await repository.findById(noticeId, scope);
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

const create = async (data, scope) => {
  await checkReferences(data, scope);
  return repository.create(pick(data));
};

const update = async (noticeId, data, scope) => {
  await checkReferences(data, scope);
  const notice = await repository.update(noticeId, pick(data), scope);
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

const remove = async (noticeId, scope) => {
  const notice = await repository.remove(noticeId, scope);
  if (!notice) throw new AppError('NOTICE_NOT_FOUND', 'El aviso no existe');
  return notice;
};

module.exports = { list, findById, create, update, remove };
