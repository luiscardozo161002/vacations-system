'use strict';

const db = require('../../db');
const AuthAuditLog = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'log_id', order: 'desc' }];
const REFRESH_EVENT = 'TOKEN_REFRESH';
const FAILED_EVENTS = '%FAILED';

const resultColumn = db.raw(`CASE WHEN a.event_type LIKE '${FAILED_EVENTS}' THEN 'failed' ELSE 'success' END AS result`);

const filtered = ({ user_id, event_type, result, search }) => {
  const query = db('auth_audit_log as a').leftJoin('users as u', 'u.user_id', 'a.user_id');

  if (user_id !== undefined) query.where('a.user_id', user_id);
  if (event_type !== undefined) query.where('a.event_type', event_type);
  else query.whereNot('a.event_type', REFRESH_EVENT);
  if (result === 'failed') query.whereLike('a.event_type', FAILED_EVENTS);
  if (result === 'success') query.whereNot('a.event_type', 'like', FAILED_EVENTS);
  if (search) {
    query.where((match) =>
      match.whereILike('u.username', `%${search}%`).orWhereILike('a.event_type', `%${search}%`)
    );
  }
  return query;
};

const list = async ({ sort, page = 1, pageSize = 20, ...filters }) => {
  const orderBy = buildOrderBy(sort, COLUMNS, DEFAULT_SORT).map(({ column, order }) => ({ column: `a.${column}`, order }));

  const [rows, { total }] = await Promise.all([
    filtered(filters)
      .select(...COLUMNS.map((column) => `a.${column}`), 'u.username', resultColumn)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    filtered(filters).count('* as total').first(),
  ]);

  return { data: rows, pagination: paginationMeta(page, pageSize, Number(total)) };
};

const findById = (logId) => AuthAuditLog.query().select(COLUMNS).findById(logId);

module.exports = { list, findById };
