const CrudRepository = require('../../lib/crud/crud-repository');
const db = require('../../db');
const config = require('../../config');
const AuthAuditLog = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta, whereAnyOf, whereDateBetween } = require('../../lib/list-query');

const REFRESH_EVENT = 'TOKEN_REFRESH';
const SESSION_MODULE = 'session';

const named = (table, id, name) => (ids) => db(table).whereIn(id, ids).select(`${id} as id`, `${name} as name`);

const TARGET_NAMES = {
  employee: named('employees', 'employee_id', 'employee_name'),
  user: named('users', 'user_id', 'username'),
  department: named('departments', 'department_id', 'department_name'),
  shift: named('shifts', 'shift_id', 'shift_name'),
  role: named('roles', 'role_id', 'role_code'),
  notice: (ids) =>
    db('notices as n')
      .join('employees as e', 'e.employee_id', 'n.employee_id')
      .whereIn('n.notice_id', ids)
      .select('n.notice_id as id', 'e.employee_name as name'),
};

class AuthAuditLogRepository extends CrudRepository {
  constructor() {
    super({ model: AuthAuditLog, columns: COLUMNS, primaryKey: 'log_id' });
    this.defaultSort = [{ column: 'log_id', order: 'desc' }];
  }

  whereModule(query, modules) {
    const entities = [modules].flat().filter((module) => module !== SESSION_MODULE);
    const includesSession = entities.length < [modules].flat().length;
    query.where((match) => {
      if (entities.length) match.whereIn('a.entity', entities);
      if (includesSession) match.orWhereNull('a.entity');
    });
  }

  filtered({ user_id, event_type, result, entity, search, from, to }) {
    const query = db('auth_audit_log as a').leftJoin('users as u', 'u.user_id', 'a.user_id');

    if (user_id !== undefined) query.where('a.user_id', user_id);
    if (event_type !== undefined) whereAnyOf(query, 'a.event_type', event_type);
    else query.whereNot('a.event_type', REFRESH_EVENT);
    if (entity !== undefined) this.whereModule(query, entity);
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
        .leftJoin('roles as r', 'r.role_id', 'u.role_id')
        .leftJoin('employees as actor', 'actor.employee_id', 'u.employee_id')
        .select(
          ...this.columns.map((column) => `a.${column}`),
          'u.username',
          'r.role_code',
          'actor.employee_name as actor_name'
        )
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.filtered(filters).count('* as total').first(),
    ]);

    return { data: await this.withTargetNames(rows), pagination: paginationMeta(page, pageSize, Number(total)) };
  }

  async withTargetNames(rows) {
    const names = new Map();
    await Promise.all(
      Object.entries(TARGET_NAMES).map(async ([entity, findNames]) => {
        const ids = [...new Set(rows.filter((row) => row.entity === entity).map((row) => Number(row.entity_id)))].filter(
          Number.isInteger
        );
        if (!ids.length) return;
        (await findNames(ids)).forEach(({ id, name }) => names.set(`${entity}:${id}`, name));
      })
    );
    return rows.map((row) => ({ ...row, target_name: names.get(`${row.entity}:${row.entity_id}`) ?? null }));
  }
}

module.exports = new AuthAuditLogRepository();
