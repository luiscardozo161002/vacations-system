'use strict';

const db = require('../../db');
const Shift = require('./model');
const ShiftSchedule = require('./schedule-model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'shift_id', order: 'asc' }];

const list = async ({ status, sort, page = 1, pageSize = 20 }) => {
  const query = Shift.query()
    .select(COLUMNS)
    .withGraphFetched('schedule(week)')
    .orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (shiftId) => Shift.query().select(COLUMNS).withGraphFetched('schedule(week)').findById(shiftId);

const replaceSchedule = (shiftId, days) =>
  ShiftSchedule.query()
    .insert(days.map((day) => ({ ...day, shift_id: shiftId, status: 'active' })))
    .onConflict(['shift_id', 'day_of_week'])
    .merge(['is_working_day', 'check_in_time', 'check_out_time', 'status']);

const create = (data) => Shift.query().insert(data).returning(COLUMNS);

const update = async (shiftId, data) => {
  const [shift] = await Shift.query()
    .where('shift_id', shiftId)
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return shift || null;
};

const remove = async (shiftId) => {
  const [shift] = await Shift.query()
    .where('shift_id', shiftId)
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(COLUMNS);
  return shift || null;
};

module.exports = { list, findById, replaceSchedule, create, update, remove };
