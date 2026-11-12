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

const findById = async (companyId, scope) => {
  const company = await repository.findById(companyId, scope);
  if (!company) throw new AppError('COMPANY_NOT_FOUND', 'La empresa no existe');
  return company;
};

const create = (data) => repository.create(pick(data));

const update = async (companyId, data, scope) => {
  const company = await repository.update(companyId, pick(data), scope);
  if (!company) throw new AppError('COMPANY_NOT_FOUND', 'La empresa no existe');
  return company;
};

const remove = async (companyId, scope) => {
  const company = await repository.remove(companyId, scope);
  if (!company) throw new AppError('COMPANY_NOT_FOUND', 'La empresa no existe');
  return company;
};

module.exports = { list, findById, create, update, remove };
