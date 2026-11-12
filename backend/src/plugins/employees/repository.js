'use strict';

const db = require('../../db');
const Employee = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');
const { forEmployees } = require('../../lib/data-scope');

const DEFAULT_SORT = [{ column: 'employee_id', order: 'asc' }];

const list = async ({ search, company_id, department_id, status, sort, page = 1, pageSize = 20 }, scope) => {
  const query = Employee.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));
  forEmployees(query, scope, 'employee_id');

  if (search) {
    query.where((match) =>
      match.whereILike('employee_name', `%${search}%`).orWhereILike('employee_number', `%${search}%`)
    );
  }
  if (company_id !== undefined) {
    query.whereIn(
      'department_id',
      db('departments as d').join('branches as b', 'b.branch_id', 'd.branch_id').where('b.company_id', company_id).select('d.department_id')
    );
  }
  if (department_id !== undefined) query.where('department_id', department_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (employeeId, scope) =>
  forEmployees(Employee.query().select(COLUMNS).where('employee_id', employeeId), scope, 'employee_id').first();

const create = (data) => Employee.query().insert(data).returning(COLUMNS);

const update = async (employeeId, data, scope) => {
  const [employee] = await forEmployees(Employee.query().where('employee_id', employeeId), scope, 'employee_id')
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return employee || null;
};

const remove = async (employeeId, scope) => {
  const [employee] = await forEmployees(Employee.query().where('employee_id', employeeId), scope, 'employee_id')
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(COLUMNS);
  return employee || null;
};

module.exports = { list, findById, create, update, remove };
