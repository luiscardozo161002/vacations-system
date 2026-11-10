'use strict';

const Reason = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'description', order: 'asc' }];

const list = async ({ requires_approval, affects_vacation_balance, status, sort, page = 1, pageSize = 20 }) => {
  const query = Reason.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (requires_approval !== undefined) query.where('requires_approval', requires_approval);
  if (affects_vacation_balance !== undefined) query.where('affects_vacation_balance', affects_vacation_balance);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (reasonId) => Reason.query().select(COLUMNS).findById(reasonId);

const create = (data) => Reason.query().insert(data).returning(COLUMNS);

const update = async (reasonId, data) => {
  const [reason] = await Reason.query().where('reason_id', reasonId).patch(data).returning(COLUMNS);
  return reason || null;
};

const remove = async (reasonId) => {
  const [reason] = await Reason.query().where('reason_id', reasonId).patch({ status: 'inactive' }).returning(COLUMNS);
  return reason || null;
};

module.exports = { list, findById, create, update, remove };
