'use strict';

const db = require('../db');

const scopeFrom = (credentials) => ({
  role: credentials.role,
  branchIds: credentials.branch_ids || [],
  employeeId: credentials.employee_id || 0,
});

const isGlobal = (scope) => scope.role === 'SUPERUSER';

const branchIds = (scope) =>
  scope.role === 'USER'
    ? db('branches').whereIn('branch_id', scope.branchIds).select('branch_id')
    : db('employees as e')
        .join('departments as d', 'd.department_id', 'e.department_id')
        .where('e.employee_id', scope.employeeId)
        .select('d.branch_id');

const companyIds = (scope) => db('branches').whereIn('branch_id', branchIds(scope)).select('company_id');

const departmentIds = (scope) => db('departments').whereIn('branch_id', branchIds(scope)).select('department_id');

const employeeIds = (scope) =>
  scope.role === 'USER'
    ? db('employees').whereIn('department_id', departmentIds(scope)).select('employee_id')
    : db('employees').where('employee_id', scope.employeeId).select('employee_id');

const restrict = (ids) => (query, scope, column) => (isGlobal(scope) ? query : query.whereIn(column, ids(scope)));

const allows = (ids, column) => async (scope, id) =>
  isGlobal(scope) || Boolean(await ids(scope).where(column, id).first());

module.exports = {
  scopeFrom,
  inCompanies: restrict(companyIds),
  inBranches: restrict(branchIds),
  inDepartments: restrict(departmentIds),
  forEmployees: restrict(employeeIds),
  allowsBranch: allows(branchIds, 'branch_id'),
  allowsDepartment: allows(departmentIds, 'department_id'),
  allowsEmployee: allows(employeeIds, 'employee_id'),
};
