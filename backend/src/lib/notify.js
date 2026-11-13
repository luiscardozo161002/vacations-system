'use strict';

const db = require('../db');

const notify = (notification) =>
  db('notifications').insert(notification).onConflict(['user_id', 'kind', 'reference']).ignore().returning('notification_id');

const shortDate = (iso) => iso.split('-').reverse().join('/');

module.exports = { notify, shortDate };
