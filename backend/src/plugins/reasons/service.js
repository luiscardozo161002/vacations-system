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

const findById = async (reasonId) => {
  const reason = await repository.findById(reasonId);
  if (!reason) throw new AppError('REASON_NOT_FOUND', 'El motivo no existe');
  return reason;
};

const create = (data) => repository.create(pick(data));

const update = async (reasonId, data) => {
  const reason = await repository.update(reasonId, pick(data));
  if (!reason) throw new AppError('REASON_NOT_FOUND', 'El motivo no existe');
  return reason;
};

const remove = async (reasonId) => {
  const reason = await repository.remove(reasonId);
  if (!reason) throw new AppError('REASON_NOT_FOUND', 'El motivo no existe');
  return reason;
};

module.exports = { list, findById, create, update, remove };
