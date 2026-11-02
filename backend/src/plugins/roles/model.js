'use strict';

const { Model } = require('objection');

class Role extends Model {
  static get tableName() {
    return 'roles';
  }

  static get idColumn() {
    return 'role_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['role_code', 'description'],
      additionalProperties: false,
      properties: {
        role_id: { type: 'integer' },
        role_code: { type: 'string', maxLength: 30 },
        description: { type: 'string', maxLength: 150 },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    };
  }
}

module.exports = Role;
