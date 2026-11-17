const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

module.exports = new CrudRoutes({
  name: 'vacation-accrual-rules',
  tag: 'vacation-accrual-rules',
  path: '/api/v1/vacation-accrual-rules',
  idParam: 'ruleId',
  primaryKey: 'rule_id',
  label: { singular: 'vacation accrual rule', plural: 'vacation accrual rules' },
  permissions: { view: 'rules:view', create: 'rules:create', update: 'rules:update', delete: 'rules:delete' },
  schemas,
  service,
  audit: {
    entity: 'accrual_rule',
    events: { create: 'RULE_CREATED', update: 'RULE_UPDATED', remove: 'RULE_DEACTIVATED' },
  },
}).plugin();
