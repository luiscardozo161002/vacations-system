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

const findById = async (shiftId) => {
  const shift = await repository.findById(shiftId);
  if (!shift) throw new AppError('SHIFT_NOT_FOUND', 'El turno no existe');
  return shift;
};

const create = (data) => repository.create(pick(data));

const update = async (shiftId, data) => {
  const shift = await repository.update(shiftId, pick(data));
  if (!shift) throw new AppError('SHIFT_NOT_FOUND', 'El turno no existe');
  return shift;
};

const remove = async (shiftId) => {
  const shift = await repository.remove(shiftId);
  if (!shift) throw new AppError('SHIFT_NOT_FOUND', 'El turno no existe');
  return shift;
};

module.exports = { list, findById, create, update, remove };
