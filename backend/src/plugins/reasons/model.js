'use strict';

const { Model } = require('objection');

class Reason extends Model {
  static get tableName() {
    return 'reasons';
  }

  static get idColumn() {
    return 'reason_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['description'],
      additionalProperties: false,
      properties: {
        reason_id: { type: 'integer' },
        description: { type: 'string', maxLength: 100 },
        requires_approval: { type: 'boolean' },
        affects_vacation_balance: { type: 'boolean' },
      },
    };
  }
}

module.exports = Reason;
