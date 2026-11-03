'use strict';

const { Model } = require('objection');

class Permission extends Model {
  static get tableName() {
    return 'permissions';
  }

  static get idColumn() {
    return 'permission_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['permission_code', 'description'],
      additionalProperties: false,
      properties: {
        permission_id: { type: 'integer' },
        permission_code: { type: 'string', maxLength: 60 },
        description: { type: 'string', maxLength: 150 },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    };
  }
}

module.exports = Permission;
