'use strict';

const { Model } = require('objection');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get idColumn() {
    return 'user_id';
  }

  static get jsonAttributes() {
    return [];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['role_id', 'username', 'email', 'password_hash'],
      additionalProperties: false,
      properties: {
        user_id: { type: 'integer' },
        employee_id: { type: ['integer', 'null'] },
        role_id: { type: 'integer' },
        username: { type: 'string', maxLength: 50 },
        email: { type: 'string', maxLength: 120 },
        password_hash: { type: 'string', maxLength: 255 },
        status: { type: 'string', enum: ['active', 'inactive', 'locked'] },
        review_actions: { type: 'array', items: { type: 'string', enum: ['approve', 'reject', 'cancel'] } },
        mfa_enabled: { type: 'boolean' },
        mfa_secret: { type: ['string', 'null'], maxLength: 255 },
        failed_login_attempts: { type: 'integer' },
        locked_until: { type: ['string', 'null'] },
        last_login_at: { type: ['string', 'null'] },
        last_login_ip: { type: ['string', 'null'], maxLength: 45 },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    };
  }
}

module.exports = User;
