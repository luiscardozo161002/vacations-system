'use strict';

const { Model } = require('objection');

class RolePermission extends Model {
  static get tableName() {
    return 'role_permissions';
  }

  static get idColumn() {
    return ['role_id', 'permission_id'];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['role_id', 'permission_id'],
      additionalProperties: false,
      properties: {
        role_id: { type: 'integer' },
        permission_id: { type: 'integer' },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    };
  }
}

module.exports = RolePermission;
