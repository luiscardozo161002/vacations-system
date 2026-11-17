const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

module.exports = new CrudRoutes({
  name: 'company',
  tag: 'companies',
  path: '/api/v1/companies',
  idParam: 'companyId',
  primaryKey: 'company_id',
  label: { singular: 'company', plural: 'companies' },
  permissions: { view: 'companies:view', create: 'companies:create', update: 'companies:update', delete: 'companies:delete' },
  schemas,
  service,
}).plugin();
