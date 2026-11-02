'use strict';

const AuthAuditLog = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ user_id, event_type, page = 1, pageSize = 20 }) => {
  const query = AuthAuditLog.query().select(COLUMNS).orderBy('created_at', 'desc');

  if (user_id !== undefined) query.where('user_id', user_id);
  if (event_type !== undefined) query.where('event_type', event_type);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (logId) => AuthAuditLog.query().select(COLUMNS).findById(logId);

module.exports = { list, findById };
