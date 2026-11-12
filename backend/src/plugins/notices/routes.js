'use strict';

const { requires } = require('../../lib/permissions');
const service = require('./service');
const schemas = require('./schemas');

const noticesPlugin = {
  name: 'notices-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/notices',
        options: {
          description: 'List absence notices',
          tags: ['api', 'notices'],
          auth: requires('requests:view', 'notices:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/notices/{noticeId}',
        options: {
          description: 'Get a notice by ID',
          tags: ['api', 'notices'],
          auth: requires('requests:view', 'notices:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.noticeId),
      },
      {
        method: 'POST',
        path: '/api/v1/notices',
        options: {
          description: 'Create an absence notice',
          tags: ['api', 'notices'],
          auth: requires('requests:create', 'notices:create'),
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const notice = await service.create(request.payload);
          return h.response(notice).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/notices/{noticeId}',
        options: {
          description: 'Update a notice',
          tags: ['api', 'notices'],
          auth: requires('requests:update', 'notices:update'),
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.noticeId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/notices/{noticeId}',
        options: {
          description: 'Cancel a notice',
          tags: ['api', 'notices'],
          auth: requires('requests:delete'),
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.noticeId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = noticesPlugin;
