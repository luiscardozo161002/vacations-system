'use strict';

const service = require('./service');
const schemas = require('./schemas');

const vacationEntitlementsPlugin = {
  name: 'vacation-entitlements-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/vacation-entitlements',
        options: {
          description: 'List vacation entitlements',
          tags: ['api', 'vacation-entitlements'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/vacation-entitlements/{entitlementId}',
        options: {
          description: 'Get a vacation entitlement by ID',
          tags: ['api', 'vacation-entitlements'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.entitlementId),
      },
      {
        method: 'POST',
        path: '/api/v1/vacation-entitlements',
        options: {
          description: 'Create a vacation entitlement',
          tags: ['api', 'vacation-entitlements'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const entitlement = await service.create(request.payload);
          return h.response(entitlement).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/vacation-entitlements/{entitlementId}',
        options: {
          description: 'Update a vacation entitlement',
          tags: ['api', 'vacation-entitlements'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.entitlementId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/vacation-entitlements/{entitlementId}',
        options: {
          description: 'Deactivate a vacation entitlement',
          tags: ['api', 'vacation-entitlements'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.entitlementId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = vacationEntitlementsPlugin;
