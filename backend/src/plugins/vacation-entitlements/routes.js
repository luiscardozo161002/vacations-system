'use strict';

const { requires } = require('../../lib/permissions');
const { scopeFrom } = require('../../lib/data-scope');
const Boom = require('@hapi/boom');
const Joi = require('joi');
const service = require('./service');
const { rollover } = require('./rollover');
const schemas = require('./schemas');

const vacationEntitlementsPlugin = {
  name: 'vacation-entitlements-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'POST',
        path: '/api/v1/vacation-entitlements/generate',
        options: {
          description: 'Open current periods, expire ended ones and send period reminders',
          tags: ['api', 'vacation-entitlements'],
          auth: requires('balances:update'),
          validate: {
            payload: Joi.object({
              date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('El formato es AAAA-MM-DD'),
            })
              .allow(null)
              .unknown(false),
          },
        },
        handler: (request) => {
          if (request.auth.credentials.role !== 'SUPERUSER') throw Boom.forbidden();
          return rollover(request.payload?.date);
        },
      },
      {
        method: 'GET',
        path: '/api/v1/vacation-entitlements',
        options: {
          description: 'List vacation entitlements',
          tags: ['api', 'vacation-entitlements'],
          auth: requires('balances:view'),
          validate: { query: schemas.list },
        },
        handler: (request) => service.list(request.query, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'GET',
        path: '/api/v1/vacation-entitlements/{entitlementId}',
        options: {
          description: 'Get a vacation entitlement by ID',
          tags: ['api', 'vacation-entitlements'],
          auth: requires('balances:view'),
          validate: { params: schemas.params },
        },
        handler: (request) => service.findById(request.params.entitlementId, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'POST',
        path: '/api/v1/vacation-entitlements',
        options: {
          description: 'Create a vacation entitlement',
          tags: ['api', 'vacation-entitlements'],
          auth: requires('balances:update'),
          validate: { payload: schemas.create },
        },
        handler: async (request, h) => {
          const entitlement = await service.create(request.payload, scopeFrom(request.auth.credentials));
          return h.response(entitlement).code(201);
        },
      },
      {
        method: 'PATCH',
        path: '/api/v1/vacation-entitlements/{entitlementId}',
        options: {
          description: 'Update a vacation entitlement',
          tags: ['api', 'vacation-entitlements'],
          auth: requires('balances:update'),
          validate: { params: schemas.params, payload: schemas.update },
        },
        handler: (request) => service.update(request.params.entitlementId, request.payload, scopeFrom(request.auth.credentials)),
      },
      {
        method: 'DELETE',
        path: '/api/v1/vacation-entitlements/{entitlementId}',
        options: {
          description: 'Deactivate a vacation entitlement',
          tags: ['api', 'vacation-entitlements'],
          auth: requires('balances:update'),
          validate: { params: schemas.params },
        },
        handler: async (request, h) => {
          await service.remove(request.params.entitlementId, scopeFrom(request.auth.credentials));
          return h.response().code(204);
        },
      },
    ]);
  },
};

module.exports = vacationEntitlementsPlugin;
