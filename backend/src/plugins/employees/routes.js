'use strict';

const { requires } = require('../../lib/permissions');
const { scopeFrom } = require('../../lib/data-scope');
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
          auth: requires('employees:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'GET',
        path: '/api/v1/employees/{employeeId}',
        options: {
          description: 'Get an employee by ID',
          tags: ['api', 'employees'],
          auth: requires('employees:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.employeeId, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'POST',
        path: '/api/v1/employees',
        options: {
          description: 'Create an employee',
          tags: ['api', 'employees'],
          auth: requires('employees:create'),
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const employee = await service.create(request.payload, scopeFrom(request.auth.credentials));
          return h.response(employee).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/employees/{employeeId}',
        options: {
          description: 'Update an employee',
          tags: ['api', 'employees'],
          auth: requires('employees:update'),
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.employeeId, request.payload, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'POST',
        path: '/api/v1/employees/{employeeId}/access',
        options: {
          description: 'Create or renew the employee account with a temporary password',
          tags: ['api', 'employees'],
          auth: requires('employees:update'),
          validate: { params: schemas.params, payload: schemas.access },
        },
        handler: (request) =>
          service.resendAccess(request.params.employeeId, request.payload?.email, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'DELETE',
        path: '/api/v1/employees/{employeeId}',
        options: {
          description: 'Deactivate an employee',
          tags: ['api', 'employees'],
          auth: requires('employees:delete'),
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.employeeId, scopeFrom(request.auth.credentials));
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = employeesPlugin;
