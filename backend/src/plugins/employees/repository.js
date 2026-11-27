const db = require('../../db');
const CrudRepository = require('../../lib/crud/crud-repository');
const Employee = require('./model');
const { COLUMNS } = require('./fields');
const { whereAnyOf, whereDateBetween } = require('../../lib/list-query');
const { whereEmployee } = require('../../lib/employee-filter');

const orgPosition = (column) =>
  db('departments as d')
    .join('branches as b', 'b.branch_id', 'd.branch_id')
    .join('company as c', 'c.company_id', 'b.company_id')
    .whereRaw('d.department_id = employees.department_id')
    .select(column);

const company = { column: orgPosition('c.folio'), order: 'asc' };
const state = { column: orgPosition('b.branch_name'), order: 'asc' };
const number = { column: 'employees.employee_number', order: 'asc' };

const COMPANY_ORDER = [company, state, number];
const STATE_ORDER = [state, company, number];

const orderFor = (scope) => (scope.isGlobal ? COMPANY_ORDER : STATE_ORDER);

class EmployeeRepository extends CrudRepository {
  constructor() {
    super({ model: Employee, columns: COLUMNS, primaryKey: 'employee_id', hasUpdatedAt: true });
  }

  defaultSortFor(scope) {
    return orderFor(scope);
  }

  restrictToScope(query, scope) {
    return scope.restrictEmployees(query, 'employees.employee_id');
  }

  applyFilters(query, { status, hired_from, hired_to, ...filters }) {
    whereEmployee(query, 'employees.employee_id', filters);
    whereAnyOf(query, 'employees.status', status);
    return whereDateBetween(query, 'employees.start_date', hired_from, hired_to);
  }

  exportRows(filters, scope) {
    const query = this.model.query();
    this.restrictToScope(query, scope);
    this.applyFilters(query, filters);

    return query
      .join('departments as d', 'd.department_id', 'employees.department_id')
      .join('branches as b', 'b.branch_id', 'd.branch_id')
      .join('shifts as s', 's.shift_id', 'employees.shift_id')
      .leftJoin('users as u', 'u.employee_id', 'employees.employee_id')
      .orderBy(orderFor(scope))
      .select(
        'employees.employee_number',
        'employees.employee_name',
        'b.code as branch_code',
        'd.department_name',
        's.shift_name',
        'employees.start_date',
        'u.email',
        'employees.status'
      );
  }

  create(data, trx) {
    return this.model.query(trx).insert(data).returning(this.columns);
  }
}

module.exports = new EmployeeRepository();
