'use strict';

const { requires } = require('../../lib/permissions');
const { scopeFrom } = require('../../lib/data-scope');
const service = require('./service');
const schemas = require('./schemas');

const shiftsPlugin = {
  name: 'shifts-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/shifts',
        options: {
          description: 'List shifts',
          tags: ['api', 'shifts'],
          auth: requires('shifts:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'GET',
        path: '/api/v1/shifts/{shiftId}',
        options: {
          description: 'Get a shift by ID',
          tags: ['api', 'shifts'],
          auth: requires('shifts:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.shiftId),
      },
      {
        method: 'PUT',
        path: '/api/v1/shifts/{shiftId}/schedule',
        options: {
          description: 'Replace the weekly schedule of a shift (all 7 days at once)',
          tags: ['api', 'shifts'],
          auth: requires('shifts:update'),
          validate: { params: schemas.params, payload: schemas.schedule },
        },
        handler: (request) => service.replaceSchedule(request.params.shiftId, request.payload),
      },
      {
        method: 'POST',
        path: '/api/v1/shifts',
        options: {
          description: 'Create a shift',
          tags: ['api', 'shifts'],
          auth: requires('shifts:create'),
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const shift = await service.create(request.payload);
          return h.response(shift).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/shifts/{shiftId}',
        options: {
          description: 'Update a shift',
          tags: ['api', 'shifts'],
          auth: requires('shifts:update'),
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.shiftId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/shifts/{shiftId}',
        options: {
          description: 'Deactivate a shift',
          tags: ['api', 'shifts'],
          auth: requires('shifts:delete'),
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.shiftId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = shiftsPlugin;
