'use strict';

const { requires } = require('../../lib/permissions');
const service = require('./service');
const schemas = require('./schemas');

const usersPlugin = {
  name: 'users-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/users',
        options: {
          description: 'List users (never returns password_hash)',
          tags: ['api', 'users'],
          auth: requires('users:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/users/{userId}',
        options: {
          description: 'Get a user by ID (never returns password_hash)',
          tags: ['api', 'users'],
          auth: requires('users:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.userId),
      },
      {
        method: 'POST',
        path: '/api/v1/users',
        options: {
          description: 'Create a user (password is hashed before storing)',
          tags: ['api', 'users'],
          auth: requires('users:create'),
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const user = await service.create(request.payload);
          return h.response(user).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/users/{userId}',
        options: {
          description: 'Update a user (password is re-hashed if sent)',
          tags: ['api', 'users'],
          auth: requires('users:update'),
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.userId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/users/{userId}',
        options: {
          description: 'Deactivate a user',
          tags: ['api', 'users'],
          auth: requires('users:delete'),
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.userId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = usersPlugin;
