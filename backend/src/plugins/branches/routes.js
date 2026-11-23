const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

module.exports = new CrudRoutes({
  name: 'branches',
  tag: 'branches',
  path: '/api/v1/branches',
  idParam: 'branchId',
  primaryKey: 'branch_id',
  label: { singular: 'branch', plural: 'branches' },
  permissions: { view: 'companies:view', create: 'companies:create', update: 'companies:update', delete: 'companies:delete' },
  schemas,
  service,
  audit: { entity: 'branch', events: { create: 'BRANCH_CREATED', update: 'BRANCH_UPDATED', remove: 'BRANCH_DEACTIVATED' } },
}).plugin();
