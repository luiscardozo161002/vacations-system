const CrudRepository = require('../../lib/crud/crud-repository');
const db = require('../../db');
const config = require('../../config');
const AuthAuditLog = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta, whereAnyOf, whereDateBetween } = require('../../lib/list-query');

const REFRESH_EVENT = 'TOKEN_REFRESH';

class AuthAuditLogRepository extends CrudRepository {
  constructor() {
    super({ model: AuthAuditLog, columns: COLUMNS, primaryKey: 'log_id' });
    this.defaultSort = [{ column: 'log_id', order: 'desc' }];
  }

  filtered({ user_id, event_type, result, search, from, to }) {
    const query = db('auth_audit_log as a').leftJoin('users as u', 'u.user_id', 'a.user_id');

    if (user_id !== undefined) query.where('a.user_id', user_id);
    if (event_type !== undefined) whereAnyOf(query, 'a.event_type', event_type);
    else query.whereNot('a.event_type', REFRESH_EVENT);
    whereAnyOf(query, 'a.result', result);
    whereDateBetween(query, 'a.created_at', from, to);
    if (search) {
      query.where((match) =>
        match.whereILike('u.username', `%${search}%`).orWhereILike('a.event_type', `%${search}%`)
      );
    }
    return query;
  }

  async list({ sort, page = 1, pageSize = config.pagination.defaultPageSize, ...filters }) {
    const orderBy = buildOrderBy(sort, this.columns, this.defaultSort).map(({ column, order }) => ({
      column: `a.${column}`,
      order,
    }));

    const [rows, { total }] = await Promise.all([
      this.filtered(filters)
        .select(...this.columns.map((column) => `a.${column}`), 'u.username')
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.filtered(filters).count('* as total').first(),
    ]);

    return { data: rows, pagination: paginationMeta(page, pageSize, Number(total)) };
  }
}

module.exports = new AuthAuditLogRepository();
