'use strict';

const ShiftSchedule = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'schedule_id', order: 'asc' }];

const list = async ({ shift_id, day_of_week, status, sort, page = 1, pageSize = 20 }) => {
  const query = ShiftSchedule.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (shift_id !== undefined) query.where('shift_id', shift_id);
  if (day_of_week !== undefined) query.where('day_of_week', day_of_week);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (scheduleId) => ShiftSchedule.query().select(COLUMNS).findById(scheduleId);

const create = (data) => ShiftSchedule.query().insert(data).returning(COLUMNS);

const update = async (scheduleId, data) => {
  const [schedule] = await ShiftSchedule.query().where('schedule_id', scheduleId).patch(data).returning(COLUMNS);
  return schedule || null;
};

const remove = async (scheduleId) => {
  const [schedule] = await ShiftSchedule.query()
    .where('schedule_id', scheduleId)
    .patch({ status: 'inactive' })
    .returning(COLUMNS);
  return schedule || null;
};

module.exports = { list, findById, create, update, remove };
