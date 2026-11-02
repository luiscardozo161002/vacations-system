'use strict';

const ShiftSchedule = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ shift_id, day_of_week, page = 1, pageSize = 20 }) => {
  const query = ShiftSchedule.query().select(COLUMNS).orderBy(['shift_id', 'day_of_week']);

  if (shift_id !== undefined) query.where('shift_id', shift_id);
  if (day_of_week !== undefined) query.where('day_of_week', day_of_week);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (scheduleId) => ShiftSchedule.query().select(COLUMNS).findById(scheduleId);

const create = (data) => ShiftSchedule.query().insert(data).returning(COLUMNS);

const update = async (scheduleId, data) => {
  const [schedule] = await ShiftSchedule.query().where('schedule_id', scheduleId).patch(data).returning(COLUMNS);
  return schedule || null;
};

const remove = async (scheduleId) => {
  const schedule = await ShiftSchedule.query().deleteById(scheduleId).returning(COLUMNS);
  return schedule || null;
};

module.exports = { list, findById, create, update, remove };
