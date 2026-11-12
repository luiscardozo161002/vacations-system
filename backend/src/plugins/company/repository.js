'use strict';

const db = require('../../db');
const Company = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');
const { inCompanies } = require('../../lib/data-scope');

const DEFAULT_SORT = [{ column: 'company_id', order: 'asc' }];

const list = async ({ status, sort, page = 1, pageSize = 20 }, scope) => {
  const query = Company.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));
  inCompanies(query, scope, 'company_id');

  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (companyId, scope) =>
  inCompanies(Company.query().select(COLUMNS).where('company_id', companyId), scope, 'company_id').first();

const create = (data) => Company.query().insert(data).returning(COLUMNS);

const update = async (companyId, data, scope) => {
  const [company] = await inCompanies(Company.query().where('company_id', companyId), scope, 'company_id')
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return company || null;
};

const remove = async (companyId, scope) => {
  const [company] = await inCompanies(Company.query().where('company_id', companyId), scope, 'company_id')
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(COLUMNS);
  return company || null;
};

module.exports = { list, findById, create, update, remove };
