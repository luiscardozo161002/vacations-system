'use strict';

const db = require('../../db');
const Company = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'company_name', order: 'asc' }];

const list = async ({ status, sort, page = 1, pageSize = 20 }) => {
  const query = Company.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (companyId) => Company.query().select(COLUMNS).findById(companyId);

const create = (data) => Company.query().insert(data).returning(COLUMNS);

const update = async (companyId, data) => {
  const [company] = await Company.query()
    .where('company_id', companyId)
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return company || null;
};

const remove = async (companyId) => {
  const [company] = await Company.query()
    .where('company_id', companyId)
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(COLUMNS);
  return company || null;
};

module.exports = { list, findById, create, update, remove };
