const db = require('../db');

class Notifier {
  send(notification) {
    return db('notifications')
      .insert(notification)
      .onConflict(['user_id', 'kind', 'reference'])
      .ignore()
      .returning('notification_id');
  }

  shortDate(iso) {
    return iso.split('-').reverse().join('/');
  }
}

module.exports = new Notifier();
