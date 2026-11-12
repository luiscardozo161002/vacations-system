'use strict';

const { requires } = require('../../lib/permissions');
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
          description: 'List absence reasons',
          tags: ['api', 'reasons'],
          auth: requires('reasons:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/reasons/{reasonId}',
        options: {
          description: 'Get a reason by ID',
          tags: ['api', 'reasons'],
          auth: requires('reasons:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.reasonId),
      },
      {
        method: 'POST',
        path: '/api/v1/reasons',
        options: {
          description: 'Create a reason',
          tags: ['api', 'reasons'],
          auth: requires('reasons:create'),
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
          description: 'Update a reason',
          tags: ['api', 'reasons'],
          auth: requires('reasons:update'),
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.reasonId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/reasons/{reasonId}',
        options: {
          description: 'Deactivate a reason',
          tags: ['api', 'reasons'],
          auth: requires('reasons:delete'),
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
