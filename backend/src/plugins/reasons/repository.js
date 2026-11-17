const CrudRepository = require('../../lib/crud/crud-repository');
const Reason = require('./model');
const { COLUMNS } = require('./fields');

class ReasonRepository extends CrudRepository {
  constructor() {
    super({ model: Reason, columns: COLUMNS, primaryKey: 'reason_id' });
  }

  applyFilters(query, filters) {
    const { requires_approval, affects_vacation_balance } = filters;
    if (requires_approval !== undefined) query.where('requires_approval', requires_approval);
    if (affects_vacation_balance !== undefined) query.where('affects_vacation_balance', affects_vacation_balance);
    return super.applyFilters(query, filters);
  }
}

module.exports = new ReasonRepository();
