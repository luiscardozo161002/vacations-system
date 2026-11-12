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

const replaceSchedule = async (shiftId, days) => {
  await findById(shiftId);

  const invalidDay = days.find((day) => day.is_working_day && day.check_out_time <= day.check_in_time);
  if (invalidDay) {
    throw new AppError('INVALID_SCHEDULE', `La salida debe ser después de la entrada (día ${invalidDay.day_of_week})`);
  }

  await repository.replaceSchedule(shiftId, days);
  return findById(shiftId);
};

const create = async (data) => {
  const shift = await repository.create(pick(data));
  return findById(shift.shift_id);
};

const update = async (shiftId, data) => {
  const shift = await repository.update(shiftId, pick(data));
  if (!shift) throw new AppError('SHIFT_NOT_FOUND', 'El turno no existe');
  return findById(shiftId);
};

const remove = async (shiftId) => {
  const shift = await repository.remove(shiftId);
  if (!shift) throw new AppError('SHIFT_NOT_FOUND', 'El turno no existe');
  return shift;
};

module.exports = { list, findById, replaceSchedule, create, update, remove };
