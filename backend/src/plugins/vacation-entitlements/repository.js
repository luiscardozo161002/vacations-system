const CrudRepository = require('../../lib/crud/crud-repository');
const VacationEntitlement = require('./model');
const { COLUMNS } = require('./fields');

class VacationEntitlementRepository extends CrudRepository {
  constructor() {
    super({ model: VacationEntitlement, columns: COLUMNS, primaryKey: 'entitlement_id' });
  }

  restrictToScope(query, scope) {
    return scope.restrictEmployees(query, 'employee_id');
  }

  applyFilters(query, filters) {
    if (filters.employee_id !== undefined) query.where('employee_id', filters.employee_id);
    if (filters.period_year !== undefined) query.where('period_year', filters.period_year);
    return super.applyFilters(query, filters);
  }
}

module.exports = new VacationEntitlementRepository();
