const Boom = require('@hapi/boom');
const ApiRoutes = require('../../lib/api-routes');
const AttemptLimiter = require('../../lib/attempt-limiter');
const auditLog = require('../../lib/audit');
const config = require('../../config');
const service = require('./service');
const schemas = require('./schemas');

class AuthRoutes extends ApiRoutes {
  constructor(options) {
    super(options);
    this.schemas = options.schemas;
    this.failedLogins = new AttemptLimiter({
      max: config.auth.maxFailedLoginsPerIp,
      windowMs: config.auth.failedLoginsWindowMinutes * 60 * 1000,
    });
  }

  routes() {
    return [
      this.loginRoute(),
      this.publicRoute('refresh', 'Exchange a refresh token for a new access token', (request) =>
        this.service.refresh(request.payload, auditLog.requestContext(request))
      ),
      this.logoutRoute(),
      this.publicRoute(
        'password-reset/request',
        'Request a password reset token for an email',
        (request) => this.service.requestPasswordReset(request.payload, auditLog.requestContext(request)),
        this.schemas.passwordResetRequest
      ),
      this.publicRoute(
        'password-reset/confirm',
        'Confirm a password reset with a new password',
        (request) => this.service.confirmPasswordReset(request.payload, auditLog.requestContext(request)),
        this.schemas.passwordResetConfirm
      ),
      this.meRoute(),
      this.updateMeRoute(),
      this.changePasswordRoute(),
    ];
  }

  async login(request) {
    const { ip } = auditLog.requestContext(request);
    if (this.failedLogins.isBlocked(ip)) {
      throw Boom.tooManyRequests('Demasiados intentos fallidos desde esta red; intenta de nuevo en unos minutos');
    }

    try {
      return await this.service.login(request.payload, auditLog.requestContext(request));
    } catch (err) {
      if (err.code === 'INVALID_CREDENTIALS') this.failedLogins.record(ip);
      throw err;
    }
  }

  loginRoute() {
    return this.route({
      method: 'POST',
      path: '/api/v1/auth/login',
      description: 'Log in with username and password',
      permission: false,
      validate: { payload: this.schemas.login },
      handler: (request) => this.login(request),
    });
  }

  publicRoute(name, description, handler, validation = this.schemas[name]) {
    return this.route({
      method: 'POST',
      path: `/api/v1/auth/${name}`,
      description,
      permission: false,
      validate: { payload: validation },
      handler,
    });
  }

  logoutRoute() {
    return this.route({
      method: 'POST',
      path: '/api/v1/auth/logout',
      description: 'Revoke a refresh token',
      permission: false,
      validate: { payload: this.schemas.logout },
      handler: async (request, h) => {
        await this.service.logout(request.payload, auditLog.requestContext(request));
        return h.response().code(204);
      },
    });
  }

  meRoute() {
    return this.route({
      method: 'GET',
      path: '/api/v1/auth/me',
      description: 'Get the current user with role, employee and permissions',
      handler: (request) => this.service.getMe(request.auth.credentials.user_id),
    });
  }

  updateMeRoute() {
    return this.route({
      method: 'PATCH',
      path: '/api/v1/auth/me',
      description: 'Update the current user username or email',
      validate: { payload: this.schemas.updateMe },
      handler: (request) => this.service.updateMe(request.auth.credentials.user_id, request.payload),
    });
  }

  changePasswordRoute() {
    return this.route({
      method: 'POST',
      path: '/api/v1/auth/me/password',
      description: 'Change the current user password and revoke every other session',
      validate: { payload: this.schemas.changePassword },
      handler: (request) =>
        this.service.changePassword(request.auth.credentials.user_id, request.payload, auditLog.requestContext(request)),
    });
  }
}

module.exports = new AuthRoutes({ name: 'auth', service, schemas }).plugin();
