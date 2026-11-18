const CrudRepository = require('../../lib/crud/crud-repository');
const db = require('../../db');
const Notice = require('./model');
const { COLUMNS } = require('./fields');
const { whereAnyOf } = require('../../lib/list-query');

class NoticeRepository extends CrudRepository {
  constructor() {
    super({ model: Notice, columns: COLUMNS, primaryKey: 'notice_id' });
  }

  restrictToScope(query, scope) {
    return scope.restrictEmployees(query, 'employee_id');
  }

  applyFilters(query, filters) {
    const { employee_id, department_id, reason_id, kind, status, from, to } = filters;

    whereAnyOf(query, 'employee_id', employee_id);
    if (department_id !== undefined) {
      query.whereIn('employee_id', whereAnyOf(db('employees'), 'department_id', department_id).select('employee_id'));
    }
    whereAnyOf(query, 'reason_id', reason_id);
    whereAnyOf(query, 'kind', kind);
    whereAnyOf(query, 'status', status);
    if (from !== undefined) query.where('absence_end_date', '>=', from);
    if (to !== undefined) query.where('absence_start_date', '<=', to);
    return query;
  }

  create(data, trx) {
    return this.model.query(trx).insert(data).returning(this.columns);
  }

  async patchById(noticeId, data, trx) {
    const [notice] = await this.model.query(trx).where('notice_id', noticeId).patch(data).returning(this.columns);
    return notice;
  }

  async transition(noticeId, { from, to, onlyBeforeStart = [] }, patch, trx) {
    const [notice] = await this.model
      .query(trx)
      .where('notice_id', noticeId)
      .where((query) => {
        query.whereIn(
          'status',
          from.filter((status) => !onlyBeforeStart.includes(status))
        );
        if (onlyBeforeStart.length) {
          query.orWhere((future) =>
            future.whereIn('status', onlyBeforeStart).where('absence_start_date', '>', db.raw('CURRENT_DATE'))
          );
        }
      })
      .patch({ ...patch, status: to })
      .returning(this.columns);
    return notice ?? null;
  }

  async findReviewActions(userId) {
    const row = await db('users').where('user_id', userId).first('review_actions');
    return row?.review_actions ?? [];
  }
}

module.exports = new NoticeRepository();
