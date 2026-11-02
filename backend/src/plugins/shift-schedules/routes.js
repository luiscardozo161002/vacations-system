'use strict';

const service = require('./service');
const schemas = require('./schemas');

const shiftSchedulesPlugin = {
  name: 'shift-schedules-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/shift-schedules',
        options: {
          description: 'List shift schedules with pagination and optional filters by shift and day',
          tags: ['api', 'shift-schedules'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/shift-schedules/{scheduleId}',
        options: {
          description: 'Get a single shift schedule by ID',
          tags: ['api', 'shift-schedules'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.scheduleId),
      },
      {
        method: 'POST',
        path: '/api/v1/shift-schedules',
        options: {
          description: 'Create a new shift schedule entry',
          tags: ['api', 'shift-schedules'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const schedule = await service.create(request.payload);
          return h.response(schedule).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/shift-schedules/{scheduleId}',
        options: {
          description: 'Update an existing shift schedule entry',
          tags: ['api', 'shift-schedules'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.scheduleId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/shift-schedules/{scheduleId}',
        options: {
          description: 'Permanently delete a shift schedule entry (no soft delete: this catalog has no status column)',
          tags: ['api', 'shift-schedules'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.scheduleId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = shiftSchedulesPlugin;
