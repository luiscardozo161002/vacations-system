const db = require('../../db');
const notices = require('../notices/service');
const DataScope = require('../../lib/data-scope');

const LIST_LIMIT = 20;
const PENDING_LIMIT = 10;
const COLUMNS = ['notification_id', 'kind', 'title', 'body', 'link', 'read_at', 'created_at'];

class NotificationService {
  constructor(notices) {
    this.notices = notices;
  }

  async findPending(credentials) {
    if (!credentials.scope.includes('approvals:review')) return { total: 0, data: [] };
    const page = await this.notices.list(
      { status: 'pending', sort: 'request_date', page: 1, pageSize: PENDING_LIMIT },
      DataScope.from(credentials)
    );
    return { total: page.pagination.total, data: page.data };
  }

  async listMine(credentials) {
    const userId = credentials.user_id;
    const [data, unread, pending] = await Promise.all([
      db('notifications').where('user_id', userId).orderBy('created_at', 'desc').limit(LIST_LIMIT).select(COLUMNS),
      db('notifications').where('user_id', userId).whereNull('read_at').count('* as total').first(),
      this.findPending(credentials),
    ]);
    return { data, unread: Number(unread.total), pending };
  }

  async markAllRead(credentials) {
    await db('notifications')
      .where('user_id', credentials.user_id)
      .whereNull('read_at')
      .update({ read_at: db.fn.now() });
    return this.listMine(credentials);
  }
}

module.exports = new NotificationService(notices);
