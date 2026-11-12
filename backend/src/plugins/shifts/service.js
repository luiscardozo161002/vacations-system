'use strict';

const repository = require('./repository');
const db = require('../../db');
const { forEmployees } = require('../../lib/data-scope');
const { AppError } = require('../../lib/app-error');
const { EDITABLE_FIELDS } = require('./fields');

const pick = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

const withEmployeeCounts = async (shifts, scope) => {
  const counts = await forEmployees(db('employees'), scope, 'employee_id')
    .whereIn('shift_id', shifts.map((shift) => shift.shift_id))
    .where('status', 'active')
    .groupBy('shift_id')
    .select('shift_id', db.raw('COUNT(*)::int AS total'));
  const countOf = new Map(counts.map((row) => [row.shift_id, row.total]));
  return shifts.map((shift) => ({ ...shift, active_employees: countOf.get(shift.shift_id) ?? 0 }));
};

const list = async (filters, scope) => {
  const page = await repository.list(filters);
  return { ...page, data: await withEmployeeCounts(page.data, scope) };
};

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
