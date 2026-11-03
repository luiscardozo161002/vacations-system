'use strict';

const service = require('./service');
const schemas = require('./schemas');

const employeesPlugin = {
  name: 'employees-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/employees',
        options: {
          description: 'List employees',
          tags: ['api', 'employees'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/employees/{employeeId}',
        options: {
          description: 'Get an employee by ID',
          tags: ['api', 'employees'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.employeeId),
      },
      {
        method: 'POST',
        path: '/api/v1/employees',
        options: {
          description: 'Create an employee',
          tags: ['api', 'employees'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const employee = await service.create(request.payload);
          return h.response(employee).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/employees/{employeeId}',
        options: {
          description: 'Update an employee',
          tags: ['api', 'employees'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.employeeId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/employees/{employeeId}',
        options: {
          description: 'Deactivate an employee',
          tags: ['api', 'employees'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.employeeId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = employeesPlugin;
