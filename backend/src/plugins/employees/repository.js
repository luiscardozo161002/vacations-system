const CrudRepository = require('../../lib/crud/crud-repository');
const db = require('../../db');
const Employee = require('./model');
const { COLUMNS } = require('./fields');
const { whereAnyOf, whereDateBetween } = require('../../lib/list-query');
const { forEmployees } = require('../../lib/data-scope');

class EmployeeRepository extends CrudRepository {
  constructor() {
    super({ model: Employee, columns: COLUMNS, primaryKey: 'employee_id', hasUpdatedAt: true });
  }

  restrictToScope(query, scope) {
    return forEmployees(query, scope, 'employees.employee_id');
  }

  applyFilters(query, { search, company_id, department_id, status, hired_from, hired_to }) {
    if (search) {
      query.where((match) =>
        match.whereILike('employees.employee_name', `%${search}%`).orWhereILike('employees.employee_number', `%${search}%`)
      );
    }
    if (company_id !== undefined) {
      query.whereIn(
        'employees.department_id',
        db('departments as d')
          .join('branches as b', 'b.branch_id', 'd.branch_id')
          .where('b.company_id', company_id)
          .select('d.department_id')
      );
    }
    whereAnyOf(query, 'employees.department_id', department_id);
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
  }

  create(data, trx) {
    return this.model.query(trx).insert(data).returning(this.columns);
  }
}

module.exports = new EmployeeRepository();
