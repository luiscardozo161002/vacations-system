'use strict';

const Notice = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');
const { forEmployees } = require('../../lib/data-scope');

const DEFAULT_SORT = [{ column: 'notice_id', order: 'asc' }];

const list = async ({ employee_id, reason_id, status, sort, page = 1, pageSize = 20 }, scope) => {
  const query = Notice.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));
  forEmployees(query, scope, 'employee_id');

  if (employee_id !== undefined) query.where('employee_id', employee_id);
  if (reason_id !== undefined) query.where('reason_id', reason_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (noticeId, scope) =>
  forEmployees(Notice.query().select(COLUMNS).where('notice_id', noticeId), scope, 'employee_id').first();

const create = (data) => Notice.query().insert(data).returning(COLUMNS);

const update = async (noticeId, data, scope) => {
  const [notice] = await forEmployees(Notice.query().where('notice_id', noticeId), scope, 'employee_id')
    .patch(data)
    .returning(COLUMNS);
  return notice || null;
};

const remove = async (noticeId, scope) => {
  const [notice] = await forEmployees(Notice.query().where('notice_id', noticeId), scope, 'employee_id')
    .patch({ status: 'cancelled' })
    .returning(COLUMNS);
  return notice || null;
};

module.exports = { list, findById, create, update, remove };
