const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

module.exports = new CrudRoutes({
  name: 'reasons',
  tag: 'reasons',
  path: '/api/v1/reasons',
  idParam: 'reasonId',
  primaryKey: 'reason_id',
  label: { singular: 'reason', plural: 'absence reasons' },
  permissions: { view: 'reasons:view', create: 'reasons:create', update: 'reasons:update', delete: 'reasons:delete' },
  schemas,
  service,
}).plugin();
