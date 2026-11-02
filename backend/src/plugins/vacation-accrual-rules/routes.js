'use strict';

const service = require('./service');
const schemas = require('./schemas');

const vacationAccrualRulesPlugin = {
  name: 'vacation-accrual-rules-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/vacation-accrual-rules',
        options: {
          description: 'List vacation accrual rules with pagination and optional filters',
          tags: ['api', 'vacation-accrual-rules'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/vacation-accrual-rules/{ruleId}',
        options: {
          description: 'Get a single vacation accrual rule by ID',
          tags: ['api', 'vacation-accrual-rules'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.ruleId),
      },
      {
        method: 'POST',
        path: '/api/v1/vacation-accrual-rules',
        options: {
          description: 'Create a new vacation accrual rule',
          tags: ['api', 'vacation-accrual-rules'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const rule = await service.create(request.payload);
          return h.response(rule).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/vacation-accrual-rules/{ruleId}',
        options: {
          description: 'Update an existing vacation accrual rule',
          tags: ['api', 'vacation-accrual-rules'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.ruleId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/vacation-accrual-rules/{ruleId}',
        options: {
          description: 'Permanently delete an existing vacation accrual rule',
          tags: ['api', 'vacation-accrual-rules'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.ruleId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = vacationAccrualRulesPlugin;
