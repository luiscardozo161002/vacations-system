'use strict';

const db = require('../../db');
const Employee = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');
const { forEmployees } = require('../../lib/data-scope');

const DEFAULT_SORT = [{ column: 'employee_id', order: 'asc' }];

const filtered = ({ search, company_id, department_id, status }, scope) => {
  const query = Employee.query();
  forEmployees(query, scope, 'employees.employee_id');

  if (search) {
    query.where((match) =>
      match.whereILike('employees.employee_name', `%${search}%`).orWhereILike('employees.employee_number', `%${search}%`)
    );
  }
  if (company_id !== undefined) {
    query.whereIn(
      'employees.department_id',
      db('departments as d').join('branches as b', 'b.branch_id', 'd.branch_id').where('b.company_id', company_id).select('d.department_id')
    );
  }
  if (department_id !== undefined) query.where('employees.department_id', department_id);
  if (status !== undefined) query.where('employees.status', status);
  return query;
};

const list = async ({ sort, page = 1, pageSize = 20, ...filters }, scope) => {
  const query = filtered(filters, scope).select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));
  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const exportRows = (filters, scope) =>
  filtered(filters, scope)
    .join('departments as d', 'd.department_id', 'employees.department_id')
    .join('branches as b', 'b.branch_id', 'd.branch_id')
    .join('shifts as s', 's.shift_id', 'employees.shift_id')
    .leftJoin('users as u', 'u.employee_id', 'employees.employee_id')
    .orderBy('employees.employee_name')
    .select(
      'employees.employee_number',
      'employees.folio',
      'employees.employee_name',
      'b.code as branch_code',
      'd.department_name',
      's.shift_name',
      'employees.start_date',
      'u.email',
      'employees.status'
    );

const findById = (employeeId, scope) =>
  forEmployees(Employee.query().select(COLUMNS).where('employee_id', employeeId), scope, 'employee_id').first();

const create = (data, trx) => Employee.query(trx).insert(data).returning(COLUMNS);

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

module.exports = { list, exportRows, findById, create, update, remove };
