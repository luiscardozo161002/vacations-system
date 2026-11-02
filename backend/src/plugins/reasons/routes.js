'use strict';

const service = require('./service');
const schemas = require('./schemas');

const reasonsPlugin = {
  name: 'reasons-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/reasons',
        options: {
          description: 'List absence reasons with pagination',
          tags: ['api', 'reasons'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/reasons/{reasonId}',
        options: {
          description: 'Get a single reason by ID',
          tags: ['api', 'reasons'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.reasonId),
      },
      {
        method: 'POST',
        path: '/api/v1/reasons',
        options: {
          description: 'Create a new reason',
          tags: ['api', 'reasons'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const reason = await service.create(request.payload);
          return h.response(reason).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/reasons/{reasonId}',
        options: {
          description: 'Update an existing reason',
          tags: ['api', 'reasons'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.reasonId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/reasons/{reasonId}',
        options: {
          description: 'Permanently delete a reason (no soft delete: this catalog has no status column)',
          tags: ['api', 'reasons'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.reasonId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = reasonsPlugin;
