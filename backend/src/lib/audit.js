const db = require('../db');
const clientIp = require('./client-ip');

const SECRET_FIELDS = ['password', 'currentPassword', 'newPassword'];
const MAX_USER_AGENT_LENGTH = 255;
const MAX_REQUEST_ID_LENGTH = 64;

class AuditLog {
  plugin() {
    return {
      name: 'audit',
      register: (server) =>
        server.ext('onPreResponse', async (request, h) => {
          await this.record(request);
          return h.continue;
        }),
    };
  }

  statusOf(response) {
    return response.isBoom ? response.output.statusCode : response.statusCode;
  }

  errorCodeOf(response) {
    return response.isBoom
      ? (response.cause?.code ?? response.code ?? `HTTP_${response.output.statusCode}`)
      : response.source?.error?.code;
  }

  changesOf(payload) {
    if (!payload || typeof payload !== 'object') return null;
    return Object.fromEntries(Object.entries(payload).filter(([field]) => !SECRET_FIELDS.includes(field)));
  }

  entityIdOf(request, id) {
    const value = request.params[id] ?? request.response.source?.[id];
    return value === undefined || value === null ? null : String(value);
  }

  requestContext(request) {
    return {
      ip: clientIp.resolve(request),
      userAgent: request.headers['user-agent']?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
      requestId: request.info.id.slice(0, MAX_REQUEST_ID_LENGTH),
    };
  }

  async record(request) {
    const audit = request.route.settings.plugins.audit;
    const userId = request.auth.credentials?.user_id;
    if (!audit || !userId) return;

    const response = request.response;
    const failed = this.statusOf(response) >= 400;
    const { ip, userAgent, requestId } = this.requestContext(request);

    try {
      await db('auth_audit_log').insert({
        user_id: userId,
        event_type: audit.event,
        result: failed ? 'failed' : 'success',
        entity: audit.entity,
        entity_id: this.entityIdOf(request, audit.id),
        ip_address: ip,
        user_agent: userAgent,
        request_id: requestId,
        metadata: {
          changes: this.changesOf(request.payload ?? request.query),
          ...(failed && { error: this.errorCodeOf(response) }),
        },
      });
    } catch (err) {
      request.logger.error({ err, event: audit.event }, 'Could not record the audit event');
    }
  }
}

module.exports = new AuditLog();
