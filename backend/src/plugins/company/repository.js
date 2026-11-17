const CrudRepository = require('../../lib/crud/crud-repository');
const Company = require('./model');
const { COLUMNS } = require('./fields');
const { inCompanies } = require('../../lib/data-scope');

class CompanyRepository extends CrudRepository {
  constructor() {
    super({ model: Company, columns: COLUMNS, primaryKey: 'company_id', hasUpdatedAt: true });
  }

  restrictToScope(query, scope) {
    return inCompanies(query, scope, 'company_id');
  }
}

module.exports = new CompanyRepository();
