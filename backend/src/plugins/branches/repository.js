const CrudRepository = require('../../lib/crud/crud-repository');
const Branch = require('./model');
const { COLUMNS } = require('./fields');

class BranchRepository extends CrudRepository {
  constructor() {
    super({ model: Branch, columns: COLUMNS, primaryKey: 'branch_id', hasUpdatedAt: true });
  }

  restrictToScope(query, scope) {
    return scope.restrictBranches(query, 'branch_id');
  }

  applyFilters(query, filters) {
    if (filters.company_id !== undefined) query.where('company_id', filters.company_id);
    return super.applyFilters(query, filters);
  }
}

module.exports = new BranchRepository();
