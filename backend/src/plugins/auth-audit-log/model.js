'use strict';

const { Model } = require('objection');

class AuthAuditLog extends Model {
  static get tableName() {
    return 'auth_audit_log';
  }

  static get idColumn() {
    return 'log_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['event_type'],
      additionalProperties: false,
      properties: {
        log_id: { type: 'integer' },
        user_id: { type: ['integer', 'null'] },
        event_type: { type: 'string', maxLength: 40 },
        ip_address: { type: ['string', 'null'], maxLength: 45 },
        user_agent: { type: ['string', 'null'], maxLength: 255 },
        result: { type: 'string', enum: ['success', 'failed'] },
        entity: { type: ['string', 'null'], maxLength: 40 },
        entity_id: { type: ['string', 'null'], maxLength: 40 },
        request_id: { type: ['string', 'null'], maxLength: 64 },
        metadata: { type: ['object', 'null'] },
        created_at: { type: 'string' },
      },
    };
  }
}

module.exports = AuthAuditLog;
