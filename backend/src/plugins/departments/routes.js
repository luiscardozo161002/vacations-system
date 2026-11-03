'use strict';

const service = require('./service');
const schemas = require('./schemas');

const departmentsPlugin = {
  name: 'departments-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/departments',
        options: {
          description: 'List departments',
          tags: ['api', 'departments'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/departments/{departmentId}',
        options: {
          description: 'Get a department by ID',
          tags: ['api', 'departments'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.departmentId),
      },
      {
        method: 'POST',
        path: '/api/v1/departments',
        options: {
          description: 'Create a department',
          tags: ['api', 'departments'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const department = await service.create(request.payload);
          return h.response(department).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/departments/{departmentId}',
        options: {
          description: 'Update a department',
          tags: ['api', 'departments'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.departmentId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/departments/{departmentId}',
        options: {
          description: 'Deactivate a department',
          tags: ['api', 'departments'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.departmentId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = departmentsPlugin;
