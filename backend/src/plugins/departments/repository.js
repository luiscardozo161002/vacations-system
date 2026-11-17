const CrudRepository = require('../../lib/crud/crud-repository');
const Department = require('./model');
const { COLUMNS } = require('./fields');
const { inDepartments } = require('../../lib/data-scope');

class DepartmentRepository extends CrudRepository {
  constructor() {
    super({ model: Department, columns: COLUMNS, primaryKey: 'department_id', hasUpdatedAt: true });
  }

  restrictToScope(query, scope) {
    return inDepartments(query, scope, 'department_id');
  }

  applyFilters(query, filters) {
    if (filters.branch_id !== undefined) query.where('branch_id', filters.branch_id);
    return super.applyFilters(query, filters);
  }
}

module.exports = new DepartmentRepository();
