'use strict';

const Notice = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ employee_id, reason_id, status, page = 1, pageSize = 20 }) => {
  const query = Notice.query().select(COLUMNS).orderBy('request_date', 'desc');

  if (employee_id !== undefined) query.where('employee_id', employee_id);
  if (reason_id !== undefined) query.where('reason_id', reason_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (noticeId) => Notice.query().select(COLUMNS).findById(noticeId);

const create = (data) => Notice.query().insert(data).returning(COLUMNS);

const update = async (noticeId, data) => {
  const [notice] = await Notice.query().where('notice_id', noticeId).patch(data).returning(COLUMNS);
  return notice || null;
};

const remove = async (noticeId) => {
  const notice = await Notice.query().deleteById(noticeId).returning(COLUMNS);
  return notice || null;
};

module.exports = { list, findById, create, update, remove };
