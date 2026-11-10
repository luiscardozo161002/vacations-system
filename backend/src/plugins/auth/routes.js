'use strict';

const Boom = require('@hapi/boom');
const service = require('./service');
const schemas = require('./schemas');
const config = require('../../config');
const { createAttemptLimiter } = require('../../lib/attempt-limiter');

const failedLogins = createAttemptLimiter({
  max: config.auth.maxFailedLoginsPerIp,
  windowMs: config.auth.failedLoginsWindowMinutes * 60 * 1000,
});

const login = async (request) => {
  const ip = request.info.remoteAddress;
  if (failedLogins.isBlocked(ip)) {
    throw Boom.tooManyRequests('Demasiados intentos fallidos desde esta red; intenta de nuevo en unos minutos');
  }

  try {
    return await service.login(request.payload, context(request));
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') failedLogins.record(ip);
    throw err;
  }
};

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
        handler: login,
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
      {
        method: 'GET',
        path: '/api/v1/auth/me',
        options: {
          description: 'Get the current user with role, employee and permissions',
          tags: ['api', 'auth'],
        },
        handler: (request) => service.getMe(request.auth.credentials.user_id),
      },
      {
        method: 'PATCH',
        path: '/api/v1/auth/me',
        options: {
          description: 'Update the current user username or email',
          tags: ['api', 'auth'],
          validate: { payload: schemas.updateMe },
        },
        handler: (request) => service.updateMe(request.auth.credentials.user_id, request.payload),
      },
      {
        method: 'POST',
        path: '/api/v1/auth/me/password',
        options: {
          description: 'Change the current user password and revoke every other session',
          tags: ['api', 'auth'],
          validate: { payload: schemas.changePassword },
        },
        handler: (request) =>
          service.changePassword(request.auth.credentials.user_id, request.payload, context(request)),
      },
    ]);
  },
};

module.exports = authPlugin;
