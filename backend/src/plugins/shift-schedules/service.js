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

const findById = async (scheduleId) => {
  const schedule = await repository.findById(scheduleId);
  if (!schedule) throw new AppError('SHIFT_SCHEDULE_NOT_FOUND', 'El horario no existe');
  return schedule;
};

const create = (data) => repository.create(pick(data));

const update = async (scheduleId, data) => {
  const schedule = await repository.update(scheduleId, pick(data));
  if (!schedule) throw new AppError('SHIFT_SCHEDULE_NOT_FOUND', 'El horario no existe');
  return schedule;
};

const remove = async (scheduleId) => {
  const schedule = await repository.remove(scheduleId);
  if (!schedule) throw new AppError('SHIFT_SCHEDULE_NOT_FOUND', 'El horario no existe');
  return schedule;
};

module.exports = { list, findById, create, update, remove };
