'use strict';

const { requires } = require('../../lib/permissions');
const service = require('./service');
const schemas = require('./schemas');

const rolePermissionsPlugin = {
  name: 'role-permissions-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/role-permissions',
        options: {
          description: 'List role-permission assignments',
          tags: ['api', 'role-permissions'],
          auth: requires('permissions:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/role-permissions/{roleId}/{permissionId}',
        options: {
          description: 'Check whether a permission is assigned to a role',
          tags: ['api', 'role-permissions'],
          auth: requires('permissions:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.roleId, request.params.permissionId),
      },
      {
        method: 'POST',
        path: '/api/v1/role-permissions',
        options: {
          plugins: { audit: { event: 'PERMISSION_GRANTED', entity: 'role', id: 'role_id' } },
          description: 'Assign a permission to a role',
          tags: ['api', 'role-permissions'],
          auth: requires('permissions:update'),
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const rolePermission = await service.create(request.payload);
          return h.response(rolePermission).code(201);
        },
      },
      {
        method: 'DELETE',
        path: '/api/v1/role-permissions/{roleId}/{permissionId}',
        options: {
          plugins: { audit: { event: 'PERMISSION_REVOKED', entity: 'role', id: 'roleId' } },
          description: 'Deactivate a role-permission assignment',
          tags: ['api', 'role-permissions'],
          auth: requires('permissions:update'),
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.roleId, request.params.permissionId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = rolePermissionsPlugin;
