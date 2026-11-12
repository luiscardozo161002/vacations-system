'use strict';

const { requires } = require('../../lib/permissions');
const { scopeFrom } = require('../../lib/data-scope');
const service = require('./service');
const schemas = require('./schemas');

const branchesPlugin = {
  name: 'branches-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/branches',
        options: {
          description: 'List branches',
          tags: ['api', 'branches'],
          auth: requires('companies:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'GET',
        path: '/api/v1/branches/{branchId}',
        options: {
          description: 'Get a branch by ID',
          tags: ['api', 'branches'],
          auth: requires('companies:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.branchId, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'POST',
        path: '/api/v1/branches',
        options: {
          description: 'Create a branch',
          tags: ['api', 'branches'],
          auth: requires('companies:create'),
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const branch = await service.create(request.payload, scopeFrom(request.auth.credentials));
          return h.response(branch).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/branches/{branchId}',
        options: {
          description: 'Update a branch',
          tags: ['api', 'branches'],
          auth: requires('companies:update'),
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.branchId, request.payload, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'DELETE',
        path: '/api/v1/branches/{branchId}',
        options: {
          description: 'Deactivate a branch',
          tags: ['api', 'branches'],
          auth: requires('companies:delete'),
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.branchId, scopeFrom(request.auth.credentials));
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = branchesPlugin;
