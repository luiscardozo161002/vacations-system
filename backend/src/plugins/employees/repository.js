'use strict';

const db = require('../../db');
const Employee = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'employee_id', order: 'asc' }];

const list = async ({ department_id, status, sort, page = 1, pageSize = 20 }) => {
  const query = Employee.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (department_id !== undefined) query.where('department_id', department_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (employeeId) => Employee.query().select(COLUMNS).findById(employeeId);

const create = (data) => Employee.query().insert(data).returning(COLUMNS);

const update = async (employeeId, data) => {
  const [employee] = await Employee.query()
    .where('employee_id', employeeId)
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return employee || null;
};

const remove = async (employeeId) => {
  const [employee] = await Employee.query()
    .where('employee_id', employeeId)
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(COLUMNS);
  return employee || null;
};

module.exports = { list, findById, create, update, remove };
