'use strict';

const { Model } = require('objection');

class Branch extends Model {
  static get tableName() {
    return 'branches';
  }

  static get idColumn() {
    return 'branch_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['company_id', 'code', 'branch_name'],
      additionalProperties: false,
      properties: {
        branch_id: { type: 'integer' },
        company_id: { type: 'integer' },
        code: { type: 'string', maxLength: 20 },
        branch_name: { type: 'string', maxLength: 100 },
        status: { type: 'string', enum: ['active', 'inactive'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    };
  }
}

module.exports = Branch;
