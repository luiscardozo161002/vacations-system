'use strict';

const service = require('./service');
const schemas = require('./schemas');

const permissionsPlugin = {
  name: 'permissions-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/permissions',
        options: {
          description: 'List permissions with pagination',
          tags: ['api', 'permissions'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/permissions/{permissionId}',
        options: {
          description: 'Get a single permission by ID',
          tags: ['api', 'permissions'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.permissionId),
      },
      {
        method: 'POST',
        path: '/api/v1/permissions',
        options: {
          description: 'Create a new permission',
          tags: ['api', 'permissions'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const permission = await service.create(request.payload);
          return h.response(permission).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/permissions/{permissionId}',
        options: {
          description: 'Update an existing permission',
          tags: ['api', 'permissions'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.permissionId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/permissions/{permissionId}',
        options: {
          description: 'Permanently delete a permission (no soft delete: this catalog has no status column)',
          tags: ['api', 'permissions'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.permissionId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = permissionsPlugin;
