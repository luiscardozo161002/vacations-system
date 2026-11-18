const CrudRoutes = require('../../lib/crud/crud-routes');
const service = require('./service');
const schemas = require('./schemas');

class AuthAuditLogRoutes extends CrudRoutes {
  routes() {
    return [this.listRoute(), this.getRoute()];
  }
}

module.exports = new AuthAuditLogRoutes({
  name: 'auth-audit-log',
  path: '/api/v1/auth-audit-log',
  idParam: 'logId',
  primaryKey: 'log_id',
  label: { singular: 'auth audit log entry', plural: 'auth audit log entries' },
  descriptions: {
    list: 'List auth audit log entries (read-only)',
    get: 'Get an auth audit log entry by ID',
  },
  permissions: { view: 'audit:view' },
  schemas,
  service,
}).plugin();
