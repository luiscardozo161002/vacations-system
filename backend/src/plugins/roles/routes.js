const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

module.exports = new CrudRoutes({
  name: 'roles',
  tag: 'roles',
  path: '/api/v1/roles',
  idParam: 'roleId',
  primaryKey: 'role_id',
  label: { singular: 'role', plural: 'roles' },
  permissions: { view: 'permissions:view', create: 'permissions:update', update: 'permissions:update', delete: 'permissions:update' },
  schemas,
  service,
}).plugin();
