'use strict';

const service = require('./service');
const schemas = require('./schemas');

const context = (request) => ({
  ip: request.info.remoteAddress,
  userAgent: request.headers['user-agent'],
});

const authPlugin = {
  name: 'auth-plugin',
  version: '1.0.0',
  register: (server) => {
    server.route([
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        options: {
          description: 'Log in with username and password',
          tags: ['api', 'auth'],
          auth: false,
          validate: { payload: schemas.login },
        },
        handler: (request) => service.login(request.payload, context(request)),
      },
      {
        method: 'POST',
        path: '/api/v1/auth/refresh',
        options: {
          description: 'Exchange a refresh token for a new access token',
          tags: ['api', 'auth'],
          auth: false,
          validate: { payload: schemas.refresh },
        },
        handler: (request) => service.refresh(request.payload, context(request)),
      },
      {
        method: 'POST',
        path: '/api/v1/auth/logout',
        options: {
          description: 'Revoke a refresh token',
          tags: ['api', 'auth'],
          auth: false,
          validate: { payload: schemas.logout },
        },
        handler: async (request, h) => {
          await service.logout(request.payload, context(request));
          return h.response().code(204);
        },
      },
      {
        method: 'POST',
        path: '/api/v1/auth/password-reset/request',
        options: {
          description: 'Request a password reset token for an email',
          tags: ['api', 'auth'],
          auth: false,
          validate: { payload: schemas.passwordResetRequest },
        },
        handler: (request) => service.requestPasswordReset(request.payload, context(request)),
      },
      {
        method: 'POST',
        path: '/api/v1/auth/password-reset/confirm',
        options: {
          description: 'Confirm a password reset with a new password',
          tags: ['api', 'auth'],
          auth: false,
          validate: { payload: schemas.passwordResetConfirm },
        },
        handler: (request) => service.confirmPasswordReset(request.payload, context(request)),
      },
    ]);
  },
};

module.exports = authPlugin;
