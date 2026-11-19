const { ValidationError } = require('objection');
const { AppError } = require('./app-error');
const { BUSINESS_STATUS, DB_ERRORS, SQLSTATE_FALLBACK, HTTP_ERRORS } = require('./error-catalog');
const config = require('../config');

class ErrorHandler {
  plugin() {
    return {
      name: 'api-error-handler',
      register: (server) => server.ext('onPreResponse', (request, h) => this.handle(request, h)),
    };
  }

  handle(request, h) {
    const response = request.response;
    if (!response.isBoom) return h.continue;

    const { status, code, message } = this.describe(request, response);
    const reply = h.response({ error: { code, message } }).code(status);
    for (const [name, value] of Object.entries(response.output.headers)) reply.header(name, value);
    return reply;
  }

  describe(request, response) {
    const status = response.output.statusCode;

    if (status === 400) return this.describeBadRequest(response);
    if (HTTP_ERRORS[status]) {
      const [code, message] = HTTP_ERRORS[status];
      return { status, code, message };
    }
    if (status !== 500) return { status, code: `HTTP_${status}`, message: response.output.payload.message };

    return this.describeServerError(request, response.cause || response);
  }

  describeBadRequest(response) {
    const message = response.output.payload.message;
    if (response.data?.validation) return { status: 400, code: 'VALIDATION_ERROR', message };
    if (message === config.errors.invalidJsonMessage) {
      return { status: 400, code: 'INVALID_JSON', message: 'El cuerpo de la petición no es JSON válido' };
    }
    return { status: 400, code: 'BAD_REQUEST', message };
  }

  describeServerError(request, error) {
    if (error instanceof AppError && BUSINESS_STATUS[error.code]) {
      return { status: BUSINESS_STATUS[error.code], code: error.code, message: error.message };
    }

    if (error instanceof ValidationError) return { status: 400, code: 'INVALID_MODEL_DATA', message: error.message };

    const pg = error.nativeError || error;
    const dbError = DB_ERRORS[pg.constraint];
    if (dbError && dbError.sqlstate === pg.code) {
      return { status: dbError.status, code: dbError.code, message: dbError.message };
    }

    const fallback = SQLSTATE_FALLBACK[pg.code];
    if (fallback) return fallback;

    this.logUnhandled(request, pg, error);
    return { status: 500, code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno' };
  }

  isPostgresError(error) {
    return /^[0-9A-Z]{5}$/.test(error.code ?? '');
  }

  logUnhandled(request, pg, error) {
    const details = this.isPostgresError(pg) ? { sqlstate: pg.code, constraint: pg.constraint } : { err: error };
    request.logger.error({ ...details, method: request.method, path: request.path }, 'Unhandled error');
  }
}

module.exports = new ErrorHandler().plugin();
