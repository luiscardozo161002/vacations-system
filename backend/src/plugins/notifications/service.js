'use strict';

const db = require('../../db');

const LIST_LIMIT = 20;
const COLUMNS = ['notification_id', 'kind', 'title', 'body', 'link', 'read_at', 'created_at'];

const notify = (notification) =>
  db('notifications').insert(notification).onConflict(['user_id', 'kind', 'reference']).ignore().returning('notification_id');

const listMine = async (userId) => {
  const [data, unread] = await Promise.all([
    db('notifications').where('user_id', userId).orderBy('created_at', 'desc').limit(LIST_LIMIT).select(COLUMNS),
    db('notifications').where('user_id', userId).whereNull('read_at').count('* as total').first(),
  ]);
  return { data, unread: Number(unread.total) };
};

const markAllRead = async (userId) => {
  await db('notifications').where('user_id', userId).whereNull('read_at').update({ read_at: db.fn.now() });
  return listMine(userId);
};

module.exports = { notify, listMine, markAllRead };
