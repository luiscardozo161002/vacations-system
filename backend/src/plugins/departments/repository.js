'use strict';

const db = require('../../db');
const Department = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'department_name', order: 'asc' }];

const list = async ({ company_id, status, sort, page = 1, pageSize = 20 }) => {
  const query = Department.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (company_id !== undefined) query.where('company_id', company_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (departmentId) => Department.query().select(COLUMNS).findById(departmentId);

const create = (data) => Department.query().insert(data).returning(COLUMNS);

const update = async (departmentId, data) => {
  const [department] = await Department.query()
    .where('department_id', departmentId)
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return department || null;
};

const remove = async (departmentId) => {
  const [department] = await Department.query()
    .where('department_id', departmentId)
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(COLUMNS);
  return department || null;
};

module.exports = { list, findById, create, update, remove };
