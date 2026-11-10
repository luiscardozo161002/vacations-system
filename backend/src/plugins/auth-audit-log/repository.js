'use strict';

const AuthAuditLog = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'log_id', order: 'asc' }];

const list = async ({ user_id, event_type, sort, page = 1, pageSize = 20 }) => {
  const query = AuthAuditLog.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (user_id !== undefined) query.where('user_id', user_id);
  if (event_type !== undefined) query.where('event_type', event_type);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (logId) => AuthAuditLog.query().select(COLUMNS).findById(logId);

module.exports = { list, findById };
