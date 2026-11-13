'use strict';

const db = require('../db');
const { clientIp } = require('./client-ip');

const SECRET_FIELDS = ['password', 'currentPassword', 'newPassword'];

const statusOf = (response) => (response.isBoom ? response.output.statusCode : response.statusCode);

const errorCodeOf = (response) =>
  response.isBoom
    ? (response.cause?.code ?? response.code ?? `HTTP_${response.output.statusCode}`)
    : response.source?.error?.code;

const changesOf = (payload) =>
  payload && typeof payload === 'object'
    ? Object.fromEntries(Object.entries(payload).filter(([field]) => !SECRET_FIELDS.includes(field)))
    : null;

const entityIdOf = (request, id) => {
  const value = request.params[id] ?? request.response.source?.[id];
  return value === undefined || value === null ? null : String(value);
};

const requestContext = (request) => ({
  ip: clientIp(request),
  userAgent: request.headers['user-agent']?.slice(0, 255) ?? null,
  requestId: request.info.id.slice(0, 64),
});

const record = async (request) => {
  const audit = request.route.settings.plugins.audit;
  const userId = request.auth.credentials?.user_id;
  if (!audit || !userId) return;

  const response = request.response;
  const failed = statusOf(response) >= 400;
  const { ip, userAgent, requestId } = requestContext(request);

  try {
    await db('auth_audit_log').insert({
      user_id: userId,
      event_type: audit.event,
      result: failed ? 'failed' : 'success',
      entity: audit.entity,
      entity_id: entityIdOf(request, audit.id),
      ip_address: ip,
      user_agent: userAgent,
      request_id: requestId,
      metadata: { changes: changesOf(request.payload ?? request.query), ...(failed && { error: errorCodeOf(response) }) },
    });
  } catch (err) {
    request.logger.error({ err, event: audit.event }, 'No se pudo registrar la auditoría');
  }
};

const auditPlugin = {
  name: 'audit',
  register(server) {
    server.ext('onPreResponse', async (request, h) => {
      await record(request);
      return h.continue;
    });
  },
};

module.exports = { auditPlugin, requestContext };
