const CrudRepository = require('../../lib/crud/crud-repository');
const VacationAccrualRule = require('./model');
const { COLUMNS } = require('./fields');

class VacationAccrualRuleRepository extends CrudRepository {
  constructor() {
    super({ model: VacationAccrualRule, columns: COLUMNS, primaryKey: 'rule_id' });
  }

  applyFilters(query, filters) {
    if (filters.effective_year !== undefined) query.where('effective_year', filters.effective_year);
    return super.applyFilters(query, filters);
  }
}

module.exports = new VacationAccrualRuleRepository();
