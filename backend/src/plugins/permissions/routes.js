const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

module.exports = new CrudRoutes({
  name: 'permissions',
  tag: 'permissions',
  path: '/api/v1/permissions',
  idParam: 'permissionId',
  primaryKey: 'permission_id',
  label: { singular: 'permission', plural: 'permissions' },
  permissions: { view: 'permissions:view', create: 'permissions:update', update: 'permissions:update', delete: 'permissions:update' },
  schemas,
  service,
}).plugin();
