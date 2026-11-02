'use strict';

const service = require('./service');
const schemas = require('./schemas');

const rolesPlugin = {
  name: 'roles-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/roles',
        options: {
          description: 'List roles with pagination and optional status filter',
          tags: ['api', 'roles'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/roles/{roleId}',
        options: {
          description: 'Get a single role by ID',
          tags: ['api', 'roles'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.roleId),
      },
      {
        method: 'POST',
        path: '/api/v1/roles',
        options: {
          description: 'Create a new role',
          tags: ['api', 'roles'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const role = await service.create(request.payload);
          return h.response(role).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/roles/{roleId}',
        options: {
          description: 'Update an existing role',
          tags: ['api', 'roles'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.roleId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/roles/{roleId}',
        options: {
          description: 'Permanently delete an existing role',
          tags: ['api', 'roles'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.roleId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = rolesPlugin;
