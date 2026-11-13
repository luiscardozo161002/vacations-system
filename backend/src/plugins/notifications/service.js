'use strict';

const db = require('../../db');
const notices = require('../notices/service');
const { scopeFrom } = require('../../lib/data-scope');

const LIST_LIMIT = 20;
const PENDING_LIMIT = 10;
const COLUMNS = ['notification_id', 'kind', 'title', 'body', 'link', 'read_at', 'created_at'];

const findPending = async (credentials) => {
  if (!credentials.scope.includes('approvals:review')) return { total: 0, data: [] };
  const page = await notices.list(
    { status: 'pending', sort: 'request_date', page: 1, pageSize: PENDING_LIMIT },
    scopeFrom(credentials)
  );
  return { total: page.pagination.total, data: page.data };
};

const listMine = async (credentials) => {
  const userId = credentials.user_id;
  const [data, unread, pending] = await Promise.all([
    db('notifications').where('user_id', userId).orderBy('created_at', 'desc').limit(LIST_LIMIT).select(COLUMNS),
    db('notifications').where('user_id', userId).whereNull('read_at').count('* as total').first(),
    findPending(credentials),
  ]);
  return { data, unread: Number(unread.total), pending };
};

const markAllRead = async (credentials) => {
  await db('notifications').where('user_id', credentials.user_id).whereNull('read_at').update({ read_at: db.fn.now() });
  return listMine(credentials);
};

module.exports = { listMine, markAllRead };
