'use strict';

const db = require('../../db');
const Notice = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');
const { forEmployees } = require('../../lib/data-scope');

const DEFAULT_SORT = [{ column: 'notice_id', order: 'asc' }];

const list = async (
  { employee_id, department_id, reason_id, kind, status, from, to, sort, page = 1, pageSize = 20 },
  scope
) => {
  const query = Notice.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));
  forEmployees(query, scope, 'employee_id');

  if (employee_id !== undefined) query.where('employee_id', employee_id);
  if (department_id !== undefined) {
    query.whereIn('employee_id', db('employees').where('department_id', department_id).select('employee_id'));
  }
  if (reason_id !== undefined) query.where('reason_id', reason_id);
  if (kind !== undefined) query.where('kind', kind);
  if (status !== undefined) query.where('status', status);
  if (from !== undefined) query.where('absence_end_date', '>=', from);
  if (to !== undefined) query.where('absence_start_date', '<=', to);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (noticeId, scope) =>
  forEmployees(Notice.query().select(COLUMNS).where('notice_id', noticeId), scope, 'employee_id').first();

const create = (data, trx) => Notice.query(trx).insert(data).returning(COLUMNS);

const update = async (noticeId, data, scope) => {
  const [notice] = await forEmployees(Notice.query().where('notice_id', noticeId), scope, 'employee_id')
    .patch(data)
    .returning(COLUMNS);
  return notice || null;
};

const patchById = async (noticeId, data, trx) => {
  const [notice] = await Notice.query(trx).where('notice_id', noticeId).patch(data).returning(COLUMNS);
  return notice;
};

const transition = async (noticeId, { from, to, onlyBeforeStart = [] }, patch, trx) => {
  const [notice] = await Notice.query(trx)
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
    .returning(COLUMNS);
  return notice || null;
};

const findReviewActions = (userId) =>
  db('users')
    .where('user_id', userId)
    .first('review_actions')
    .then((row) => row?.review_actions ?? []);

module.exports = { list, findById, create, update, patchById, transition, findReviewActions };
