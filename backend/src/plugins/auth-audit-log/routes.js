'use strict';

const { requires } = require('../../lib/permissions');
const service = require('./service');
const schemas = require('./schemas');

const authAuditLogPlugin = {
  name: 'auth-audit-log-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/auth-audit-log',
        options: {
          description: 'List auth audit log entries (read-only)',
          tags: ['api', 'auth-audit-log'],
          auth: requires('audit:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/auth-audit-log/{logId}',
        options: {
          description: 'Get an auth audit log entry by ID',
          tags: ['api', 'auth-audit-log'],
          auth: requires('audit:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.logId),
      },
    ]);
  },
};

module.exports = authAuditLogPlugin;
