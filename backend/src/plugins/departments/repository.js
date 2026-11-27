const CrudRepository = require('../../lib/crud/crud-repository');
const Department = require('./model');
const { COLUMNS } = require('./fields');

class DepartmentRepository extends CrudRepository {
  constructor() {
    super({ model: Department, columns: COLUMNS, primaryKey: 'department_id', hasUpdatedAt: true, hidesInactive: true });
  }

  restrictToScope(query, scope) {
    return scope.restrictDepartments(query, 'department_id');
  }

  applyFilters(query, filters) {
    if (filters.branch_id !== undefined) query.where('branch_id', filters.branch_id);
    return super.applyFilters(query, filters);
  }
}

module.exports = new DepartmentRepository();
