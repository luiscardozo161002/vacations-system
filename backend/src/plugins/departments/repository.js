'use strict';

const db = require('../../db');
const Department = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');
const { inDepartments } = require('../../lib/data-scope');

const DEFAULT_SORT = [{ column: 'department_id', order: 'asc' }];

const list = async ({ branch_id, status, sort, page = 1, pageSize = 20 }, scope) => {
  const query = Department.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));
  inDepartments(query, scope, 'department_id');

  if (branch_id !== undefined) query.where('branch_id', branch_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (departmentId, scope) =>
  inDepartments(Department.query().select(COLUMNS).where('department_id', departmentId), scope, 'department_id').first();

const create = (data) => Department.query().insert(data).returning(COLUMNS);

const update = async (departmentId, data, scope) => {
  const [department] = await inDepartments(Department.query().where('department_id', departmentId), scope, 'department_id')
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return department || null;
};

const remove = async (departmentId, scope) => {
  const [department] = await inDepartments(Department.query().where('department_id', departmentId), scope, 'department_id')
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(COLUMNS);
  return department || null;
};

module.exports = { list, findById, create, update, remove };
