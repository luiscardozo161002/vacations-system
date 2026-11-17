const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

module.exports = new CrudRoutes({
  name: 'departments',
  tag: 'departments',
  path: '/api/v1/departments',
  idParam: 'departmentId',
  primaryKey: 'department_id',
  label: { singular: 'department', plural: 'departments' },
  permissions: { view: 'departments:view', create: 'departments:create', update: 'departments:update', delete: 'departments:delete' },
  schemas,
  service,
}).plugin();
