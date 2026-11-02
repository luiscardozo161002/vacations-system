'use strict';

const service = require('./service');
const schemas = require('./schemas');

const companyPlugin = {
  name: 'company-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/companies',
        options: {
          description: 'List companies with pagination and optional status filter',
          tags: ['api', 'companies'],
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query),
      },
      {
        method: 'GET',
        path: '/api/v1/companies/{companyId}',
        options: {
          description: 'Get a single company by ID',
          tags: ['api', 'companies'],
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.companyId),
      },
      {
        method: 'POST',
        path: '/api/v1/companies',
        options: {
          description: 'Create a new company',
          tags: ['api', 'companies'],
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const company = await service.create(request.payload);
          return h.response(company).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/companies/{companyId}',
        options: {
          description: 'Update an existing company',
          tags: ['api', 'companies'],
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.companyId, request.payload),
      },
      {
        method: 'DELETE',
        path: '/api/v1/companies/{companyId}',
        options: {
          description: 'Permanently delete an existing company',
          tags: ['api', 'companies'],
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.companyId);
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = companyPlugin;
