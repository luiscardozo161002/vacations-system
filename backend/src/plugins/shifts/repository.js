'use strict';

const db = require('../../db');
const Shift = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ status, page = 1, pageSize = 20 }) => {
  const query = Shift.query().select(COLUMNS).orderBy('shift_name');

  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (shiftId) => Shift.query().select(COLUMNS).findById(shiftId);

const create = (data) => Shift.query().insert(data).returning(COLUMNS);

const update = async (shiftId, data) => {
  const [shift] = await Shift.query()
    .where('shift_id', shiftId)
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return shift || null;
};

const remove = async (shiftId) => {
  const shift = await Shift.query().deleteById(shiftId).returning(COLUMNS);
  return shift || null;
};

module.exports = { list, findById, create, update, remove };
