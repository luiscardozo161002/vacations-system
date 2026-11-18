const db = require('../db');
const config = require('../config');

class DataScope {
  static from(credentials) {
    return new DataScope({
      role: credentials.role,
      branchIds: credentials.branch_ids || [],
      employeeId: credentials.employee_id || 0,
    });
  }

  constructor({ role, branchIds, employeeId }) {
    this.role = role;
    this.branchIds = branchIds;
    this.employeeId = employeeId;
  }

  get isGlobal() {
    return this.role === config.roles.global;
  }

  get isScoped() {
    return this.role === config.roles.scoped;
  }

  branchIdsQuery() {
    if (this.isScoped) return db('branches').whereIn('branch_id', this.branchIds).select('branch_id');
    return db('employees as e')
      .join('departments as d', 'd.department_id', 'e.department_id')
      .where('e.employee_id', this.employeeId)
      .select('d.branch_id');
  }

  companyIdsQuery() {
    return db('branches').whereIn('branch_id', this.branchIdsQuery()).select('company_id');
  }

  departmentIdsQuery() {
    return db('departments').whereIn('branch_id', this.branchIdsQuery()).select('department_id');
  }

  employeeIdsQuery() {
    if (this.isScoped) {
      return db('employees').whereIn('department_id', this.departmentIdsQuery()).select('employee_id');
    }
    return db('employees').where('employee_id', this.employeeId).select('employee_id');
  }

  restrict(query, column, idsQuery) {
    return this.isGlobal ? query : query.whereIn(column, idsQuery);
  }

  restrictCompanies(query, column) {
    return this.restrict(query, column, this.companyIdsQuery());
  }

  restrictBranches(query, column) {
    return this.restrict(query, column, this.branchIdsQuery());
  }

  restrictDepartments(query, column) {
    return this.restrict(query, column, this.departmentIdsQuery());
  }

  restrictEmployees(query, column) {
    return this.restrict(query, column, this.employeeIdsQuery());
  }

  async allows(idsQuery, column, id) {
    return this.isGlobal || Boolean(await idsQuery.where(column, id).first());
  }

  allowsBranch(id) {
    return this.allows(this.branchIdsQuery(), 'branch_id', id);
  }

  allowsDepartment(id) {
    return this.allows(this.departmentIdsQuery(), 'department_id', id);
  }

  allowsEmployee(id) {
    return this.allows(this.employeeIdsQuery(), 'employee_id', id);
  }
}

module.exports = DataScope;
